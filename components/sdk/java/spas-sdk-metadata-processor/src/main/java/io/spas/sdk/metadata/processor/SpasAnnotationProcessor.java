package io.spas.sdk.metadata.processor;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import io.spas.sdk.core.util.KebabCaseConverter;
import io.spas.sdk.metadata.annotations.*;
import io.spas.sdk.metadata.model.*;

import javax.annotation.processing.*;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.*;
import javax.lang.model.type.DeclaredType;
import javax.lang.model.type.MirroredTypesException;
import javax.lang.model.type.TypeKind;
import javax.lang.model.type.TypeMirror;
import javax.tools.Diagnostic;
import javax.tools.FileObject;
import javax.tools.StandardLocation;
import java.io.IOException;
import java.io.Writer;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Annotation processor that generates spas.json at compile time.
 * <p>
 * This processor scans for @SpasService, @SpasCommand, @SpasQuery, and @SpasEvent
 * annotations and generates a complete ServiceMetadata JSON file.
 */
@SupportedAnnotationTypes({
    "io.spas.sdk.metadata.annotations.SpasService",
    "io.spas.sdk.metadata.annotations.SpasCommand",
    "io.spas.sdk.metadata.annotations.SpasQuery",
    "io.spas.sdk.metadata.annotations.SpasEvent"
})
@SupportedOptions({
    SpasAnnotationProcessor.GENERATE_SPAS_JSON_OPTION
})
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class SpasAnnotationProcessor extends AbstractProcessor {

    private static final String SPAS_JSON_FILENAME = "spas.json";
    static final String GENERATE_SPAS_JSON_OPTION = "spas.generateSpasJson";
    private Messager messager;
    private Filer filer;
    private final ObjectMapper objectMapper = createObjectMapper();

    @Override
    public synchronized void init(ProcessingEnvironment processingEnv) {
        super.init(processingEnv);
        this.messager = processingEnv.getMessager();
        this.filer = processingEnv.getFiler();
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
        if (roundEnv.processingOver() || annotations.isEmpty()) {
            return false;
        }

        if (!isGenerationEnabled()) {
            // Compile-time generation is opt-in only.
            return false;
        }

        try {
            // Find @SpasService annotation
            Set<? extends Element> serviceElements = roundEnv.getElementsAnnotatedWith(SpasService.class);
            if (serviceElements.isEmpty()) {
                messager.printMessage(Diagnostic.Kind.WARNING,
                    "No @SpasService annotation found. spas.json will not be generated.");
                return false;
            }

            if (serviceElements.size() > 1) {
                messager.printMessage(Diagnostic.Kind.ERROR,
                    "Multiple @SpasService annotations found. Only one service annotation is allowed per module.");
                return false;
            }

            Element serviceElement = serviceElements.iterator().next();
            SpasService serviceAnnotation = serviceElement.getAnnotation(SpasService.class);

            // Collect endpoints
            List<EndpointContract> endpoints = new ArrayList<>();
            endpoints.addAll(processCommands(roundEnv, serviceAnnotation.protocol()));
            endpoints.addAll(processQueries(roundEnv, serviceAnnotation.protocol()));

            // Collect commands
            List<CommandContract> commands = processCommandContracts(roundEnv);

            // Collect events
            List<EventContract> events = processEvents(roundEnv);

            // Build ServiceMetadata
            ServiceMetadata metadata = buildServiceMetadata(
                serviceAnnotation,
                endpoints,
                commands,
                events
            );

            // Write spas.json
            writeSpasJson(metadata);

            messager.printMessage(Diagnostic.Kind.NOTE,
                "Generated " + SPAS_JSON_FILENAME + " with " + endpoints.size() + " endpoints, " + commands.size() + " commands and " + events.size() + " events");

            return true;

        } catch (Exception e) {
            messager.printMessage(Diagnostic.Kind.ERROR,
                "Failed to process SPAS annotations: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private List<EndpointContract> processCommands(RoundEnvironment roundEnv, Protocol defaultProtocol) {
        return roundEnv.getElementsAnnotatedWith(SpasCommand.class).stream()
            .filter(element -> element.getKind() == ElementKind.METHOD)
            .map(element -> {
                ExecutableElement method = (ExecutableElement) element;
                SpasCommand cmd = element.getAnnotation(SpasCommand.class);
                String kebabName = KebabCaseConverter.toKebabCase(cmd.name());
                String schemaRef = cmd.schemaRef().isEmpty()
                    ? inferEndpointSchemaRefForCommand(method, kebabName)
                    : cmd.schemaRef();
                String description = cmd.description() == null || cmd.description().isBlank() ? null : cmd.description();
                return new EndpointContract(
                    kebabName,
                    EndpointType.COMMAND,
                    defaultProtocol,
                    cmd.path(),
                    cmd.version(),
                    schemaRef,
                    description
                );
            })
            .collect(Collectors.toList());
    }

    private List<CommandContract> processCommandContracts(RoundEnvironment roundEnv) {
        Map<String, Map<String, ProducedEventRef>> producesByCommandKey = new LinkedHashMap<>();

        for (Element element : roundEnv.getElementsAnnotatedWith(SpasCommand.class)) {
            if (element.getKind() != ElementKind.METHOD) {
                continue;
            }

            SpasCommand cmd = element.getAnnotation(SpasCommand.class);
            if (cmd == null) {
                continue;
            }

            String kebabName = KebabCaseConverter.toKebabCase(cmd.name());
            String version = cmd.version();
            String commandKey = kebabName + "@" + version;

            Map<String, ProducedEventRef> produced = producesByCommandKey.computeIfAbsent(commandKey, k -> new LinkedHashMap<>());

            for (ProducedEventRef p : resolveProducedEventsFromAnnotation(cmd)) {
                String key = p.type() + "|" + p.version();
                produced.putIfAbsent(key, p);
            }
        }

        List<CommandContract> commands = new ArrayList<>();
        for (Map.Entry<String, Map<String, ProducedEventRef>> entry : producesByCommandKey.entrySet()) {
            String commandKey = entry.getKey();
            int sep = commandKey.lastIndexOf('@');
            if (sep <= 0) continue;

            String name = commandKey.substring(0, sep);
            String version = commandKey.substring(sep + 1);

            commands.add(new CommandContract(name, version, new ArrayList<>(entry.getValue().values())));
        }

        return commands;
    }

    private List<ProducedEventRef> resolveProducedEventsFromAnnotation(SpasCommand cmd) {
        List<? extends TypeMirror> typeMirrors = List.of();

        try {
            cmd.produces();
        } catch (MirroredTypesException e) {
            typeMirrors = e.getTypeMirrors();
        }

        if (typeMirrors == null || typeMirrors.isEmpty()) {
            return List.of();
        }

        List<ProducedEventRef> produced = new ArrayList<>();

        for (TypeMirror tm : typeMirrors) {
            if (tm == null) continue;

            Element typeElement = processingEnv.getTypeUtils().asElement(tm);
            if (typeElement == null) continue;

            SpasEvent evt = typeElement.getAnnotation(SpasEvent.class);
            if (evt == null) continue;

            String type = KebabCaseConverter.toKebabCase(evt.type());
            String version = evt.version();

            if (type == null || type.isBlank()) continue;
            if (version == null || version.isBlank()) continue;

            produced.add(new ProducedEventRef(type, version, "success"));
        }

        return produced;
    }

    private List<EndpointContract> processQueries(RoundEnvironment roundEnv, Protocol defaultProtocol) {
        return roundEnv.getElementsAnnotatedWith(SpasQuery.class).stream()
            .filter(element -> element.getKind() == ElementKind.METHOD)
            .map(element -> {
                ExecutableElement method = (ExecutableElement) element;
                SpasQuery qry = element.getAnnotation(SpasQuery.class);
                String kebabName = KebabCaseConverter.toKebabCase(qry.name());
                String schemaRef = qry.schemaRef().isEmpty()
                    ? inferEndpointSchemaRefForQuery(method, kebabName)
                    : qry.schemaRef();
                String description = qry.description() == null || qry.description().isBlank() ? null : qry.description();
                return new EndpointContract(
                    kebabName,
                    EndpointType.QUERY,
                    defaultProtocol,
                    qry.path(),
                    qry.version(),
                    schemaRef,
                    description
                );
            })
            .collect(Collectors.toList());
    }

    private String inferEndpointSchemaRefForCommand(ExecutableElement method, String fallbackKebabEndpointName) {
        TypeMirror schemaType = resolveCommandSchemaType(method);
        return schemaType == null
            ? "schemas/endpoints/" + fallbackKebabEndpointName + ".schema.json"
            : "schemas/endpoints/" + toKebabSimpleName(schemaType) + ".schema.json";
    }

    private String inferEndpointSchemaRefForQuery(ExecutableElement method, String fallbackKebabEndpointName) {
        TypeMirror schemaType = resolveQuerySchemaType(method);
        return schemaType == null
            ? "schemas/endpoints/" + fallbackKebabEndpointName + ".schema.json"
            : "schemas/endpoints/" + toKebabSimpleName(schemaType) + ".schema.json";
    }

    private TypeMirror resolveCommandSchemaType(ExecutableElement method) {
        // Prefer a declared (class/record) parameter type as the request DTO.
        // This keeps service authors from needing to specify schemaRef explicitly.
        for (VariableElement parameter : method.getParameters()) {
            TypeMirror type = parameter.asType();
            if (type != null && type.getKind() == TypeKind.DECLARED) {
                return type;
            }
        }
        return null;
    }

    private TypeMirror resolveQuerySchemaType(ExecutableElement method) {
        TypeMirror returnType = method.getReturnType();
        if (returnType == null || returnType.getKind() == TypeKind.VOID) {
            return null;
        }

        if (returnType.getKind() != TypeKind.DECLARED) {
            return returnType;
        }

        DeclaredType declared = (DeclaredType) returnType;
        // If the return type is a wrapper like ResponseEntity<T> or Optional<T>, prefer the inner type.
        if (declared.getTypeArguments() != null && declared.getTypeArguments().size() == 1) {
            TypeMirror inner = declared.getTypeArguments().get(0);
            if (inner != null && inner.getKind() == TypeKind.DECLARED) {
                return inner;
            }
        }
        return returnType;
    }

    private String toKebabSimpleName(TypeMirror typeMirror) {
        if (typeMirror == null || typeMirror.getKind() != TypeKind.DECLARED) {
            return "";
        }
        DeclaredType declaredType = (DeclaredType) typeMirror;
        Element typeElement = declaredType.asElement();
        if (!(typeElement instanceof TypeElement)) {
            return "";
        }
        String simpleName = ((TypeElement) typeElement).getSimpleName().toString();
        return KebabCaseConverter.toKebabCase(simpleName);
    }

    private List<EventContract> processEvents(RoundEnvironment roundEnv) {
        return roundEnv.getElementsAnnotatedWith(SpasEvent.class).stream()
            .filter(element -> element.getKind() == ElementKind.CLASS || element.getKind() == ElementKind.RECORD)
            .map(element -> {
                SpasEvent evt = element.getAnnotation(SpasEvent.class);
                String kebabType = KebabCaseConverter.toKebabCase(evt.type());
                String schemaRef;
                if (evt.schemaRef().isEmpty()) {
                    String payloadTypeName = element.getSimpleName() == null ? "" : element.getSimpleName().toString();
                    String kebabSchemaName = KebabCaseConverter.toKebabCase(payloadTypeName);
                    if (kebabSchemaName == null || kebabSchemaName.isBlank()) {
                        kebabSchemaName = kebabType;
                    }
                    schemaRef = "schemas/events/" + kebabSchemaName + ".schema.json";
                } else {
                    schemaRef = evt.schemaRef();
                }
                String description = evt.description() == null || evt.description().isBlank() ? null : evt.description();
                return new EventContract(
                    kebabType,
                    evt.version(),
                    schemaRef,
                    description
                );
            })
            .collect(Collectors.toList());
    }

    private ServiceMetadata buildServiceMetadata(
        SpasService service,
        List<EndpointContract> endpoints,
        List<CommandContract> commands,
        List<EventContract> events
    ) {
        // Build capabilities list
        List<String> capabilities = service.capabilities().length > 0
            ? Arrays.asList(service.capabilities())
            : List.of();

        // Build consistency (required by repository validation)
        Consistency consistency = new Consistency(
            ConsistencyLevel.ACID,  // Default, can be overridden in future
            QueryConsistencyLevel.EVENTUAL
        );

        // Build security with default public classification
        Security security = new Security(
            new Authentication(AuthType.NONE, null),
            List.of(DataClassification.INTERNAL)
        );

        // Build network (required by repository validation)
        Network network = new Network(List.of());

        String description = service.description() == null || service.description().isBlank() ? null : service.description();
        String license = service.license() == null || service.license().isBlank() ? null : service.license();

        return new ServiceMetadata(
            ServiceMetadata.SCHEMA_VERSION,
            service.id(),
            service.name(),
            description,
            service.version(),
            service.boundedContext(),
            capabilities,
            endpoints,
            commands,
            events,
            consistency,
            security,
            network,
            license
        );
    }

    private void writeSpasJson(ServiceMetadata metadata) throws IOException {
        FileObject resource = filer.createResource(
            StandardLocation.CLASS_OUTPUT,
            "",
            SPAS_JSON_FILENAME
        );

        try (Writer writer = resource.openWriter()) {
            objectMapper.writerWithDefaultPrettyPrinter()
                .writeValue(writer, metadata);
        }
    }

    private boolean isGenerationEnabled() {
        String value = processingEnv.getOptions().get(GENERATE_SPAS_JSON_OPTION);
        return value != null && value.equalsIgnoreCase("true");
    }

    private static ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Use camelCase to match design-time-metadata-v1 schema (ADR-039)
        mapper.setPropertyNamingStrategy(PropertyNamingStrategies.LOWER_CAMEL_CASE);
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        return mapper;
    }
}
