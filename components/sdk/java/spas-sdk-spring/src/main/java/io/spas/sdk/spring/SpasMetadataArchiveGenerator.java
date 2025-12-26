package io.spas.sdk.spring;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.spas.sdk.core.util.KebabCaseConverter;
import io.spas.sdk.metadata.JacksonConfiguration;
import io.spas.sdk.metadata.annotations.SpasCommand;
import io.spas.sdk.metadata.annotations.SpasEvent;
import io.spas.sdk.metadata.annotations.SpasQuery;
import io.spas.sdk.metadata.annotations.SpasService;
import io.spas.sdk.metadata.model.Authentication;
import io.spas.sdk.metadata.model.AuthType;
import io.spas.sdk.metadata.model.CommandContract;
import io.spas.sdk.metadata.model.Consistency;
import io.spas.sdk.metadata.model.ConsistencyLevel;
import io.spas.sdk.metadata.model.DataClassification;
import io.spas.sdk.metadata.model.EndpointContract;
import io.spas.sdk.metadata.model.EndpointType;
import io.spas.sdk.metadata.model.EventContract;
import io.spas.sdk.metadata.model.Network;
import io.spas.sdk.metadata.model.ProducedEventRef;
import io.spas.sdk.metadata.model.Protocol;
import io.spas.sdk.metadata.model.QueryConsistencyLevel;
import io.spas.sdk.metadata.model.Security;
import io.spas.sdk.metadata.model.ServiceMetadata;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Generates the SPAS metadata archive ZIP offline (no HTTP endpoint).
 */
public class SpasMetadataArchiveGenerator {

    private static final Logger log = Logger.getLogger(SpasMetadataArchiveGenerator.class.getName());
    private static final String SPAS_JSON_ENTRY = "spas.json";

    private final SpasSchemaGenerator schemaGenerator;
    private final ObjectMapper objectMapper;

    public SpasMetadataArchiveGenerator() {
        this.schemaGenerator = new SpasSchemaGenerator();
        this.objectMapper = JacksonConfiguration.getObjectMapper();
    }

    /**
     * Generates a ZIP archive containing spas.json and referenced schemas.
     * Returns null when no @SpasService is found.
     */
    public byte[] generateArchive() {
        try {
            ServiceMetadata metadata = buildMetadataAtRuntime();
            if (metadata == null) {
                log.warning("No @SpasService found on classpath; cannot generate spas.json.");
                return null;
            }

            String spasJsonContent = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(metadata);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (ZipOutputStream zos = new ZipOutputStream(baos)) {
                addStringToZip(zos, SPAS_JSON_ENTRY, spasJsonContent);

                Map<String, String> schemas = collectSchemas(metadata);
                for (Map.Entry<String, String> entry : schemas.entrySet()) {
                    addStringToZip(zos, entry.getKey(), entry.getValue());
                }
            }

            return baos.toByteArray();
        } catch (IOException e) {
            log.log(Level.SEVERE, "Failed to create metadata archive", e);
            return null;
        }
    }

    private void addStringToZip(ZipOutputStream zos, String entryName, String content) throws IOException {
        ZipEntry entry = new ZipEntry(entryName);
        zos.putNextEntry(entry);
        zos.write(content.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }

    private Map<String, String> collectSchemas(ServiceMetadata metadata) {
        Map<String, String> schemas = new HashMap<>();

        try {
            Set<String> schemaRefs = extractSchemaRefs(metadata);

            if (schemaRefs.isEmpty()) {
                log.fine("No schema references found in spas.json");
                return schemas;
            }

            log.fine("Found " + schemaRefs.size() + " schema references in spas.json");

            Set<String> missingSchemas = new HashSet<>();

            for (String schemaRef : schemaRefs) {
                ClassPathResource schemaResource = new ClassPathResource(schemaRef);
                if (schemaResource.exists()) {
                    try (InputStream is = schemaResource.getInputStream()) {
                        String schemaContent = StreamUtils.copyToString(is, StandardCharsets.UTF_8);
                        schemas.put(schemaRef, schemaContent);
                        log.fine("Loaded schema from classpath: " + schemaRef);
                    }
                } else {
                    missingSchemas.add(schemaRef);
                }
            }

            if (!missingSchemas.isEmpty()) {
                log.info("Generating " + missingSchemas.size() + " schemas dynamically");
                Map<String, String> generatedSchemas = generateMissingSchemas(missingSchemas, metadata);
                schemas.putAll(generatedSchemas);
            }
        } catch (IOException e) {
            log.log(Level.WARNING, "Failed to collect schemas", e);
        }

        return schemas;
    }

    private Set<String> extractSchemaRefs(ServiceMetadata metadata) {
        Set<String> refs = new HashSet<>();

        if (metadata == null) {
            return refs;
        }

        List<EndpointContract> endpoints = metadata.endpoints();
        if (endpoints != null) {
            for (EndpointContract endpoint : endpoints) {
                if (endpoint != null && endpoint.schemaRef() != null && !endpoint.schemaRef().isBlank()) {
                    refs.add(endpoint.schemaRef());
                }
            }
        }

        List<EventContract> events = metadata.events();
        if (events != null) {
            for (EventContract event : events) {
                if (event != null && event.schemaRef() != null && !event.schemaRef().isBlank()) {
                    refs.add(event.schemaRef());
                }
            }
        }

        return refs;
    }

    private ServiceMetadata buildMetadataAtRuntime() {
        try {
            Class<?> serviceClass = findServiceClass();
            if (serviceClass == null) {
                return null;
            }

            SpasService service = serviceClass.getAnnotation(SpasService.class);
            if (service == null) {
                return null;
            }

            String basePackage = findBasePackage();
            if (basePackage == null || basePackage.isBlank()) {
                basePackage = serviceClass.getPackageName();
            }

            List<EventContract> events = scanEvents(basePackage);
            List<EndpointContract> endpoints = scanEndpoints(basePackage, service.protocol());
            List<CommandContract> commands = scanCommands(basePackage);

            validateCommandProducedEvents(commands, events);

            List<String> capabilities = service.capabilities().length > 0
                ? Arrays.asList(service.capabilities())
                : List.of();

            Consistency consistency = new Consistency(
                ConsistencyLevel.ACID,
                QueryConsistencyLevel.EVENTUAL
            );

            Security security = new Security(
                new Authentication(AuthType.NONE, null),
                List.of(DataClassification.INTERNAL)
            );

            Network network = new Network(List.of());

            String description = (service.description() == null || service.description().isBlank())
                ? null
                : service.description();
            String license = (service.license() == null || service.license().isBlank())
                ? null
                : service.license();

            String serviceName = (service.name() == null || service.name().isBlank())
                ? service.id()
                : service.name();

            return new ServiceMetadata(
                ServiceMetadata.SCHEMA_VERSION,
                service.id(),
                serviceName,
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
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.log(Level.WARNING, "Failed to build spas.json metadata at runtime", e);
            return null;
        }
    }

    private void validateCommandProducedEvents(List<CommandContract> commands, List<EventContract> events) {
        if (commands == null || commands.isEmpty()) {
            return;
        }

        Set<String> eventKeys = new HashSet<>();
        if (events != null) {
            for (EventContract evt : events) {
                if (evt == null) continue;
                if (evt.type() == null || evt.type().isBlank()) continue;
                if (evt.version() == null || evt.version().isBlank()) continue;
                eventKeys.add(evt.type() + "|" + evt.version());
            }
        }

        for (CommandContract cmd : commands) {
            if (cmd == null) continue;
            List<ProducedEventRef> produces = cmd.produces();
            if (produces == null || produces.isEmpty()) {
                continue;
            }

            Set<String> seen = new HashSet<>();
            for (ProducedEventRef p : produces) {
                if (p == null) continue;
                String key = p.type() + "|" + p.version();
                if (!seen.add(key)) {
                    throw new IllegalStateException(
                        "Command '" + cmd.name() + "@" + cmd.version() + "' declares duplicate produced event '" + p.type() + "@" + p.version() + "'"
                    );
                }

                if (!eventKeys.contains(key)) {
                    throw new IllegalStateException(
                        "Command '" + cmd.name() + "@" + cmd.version() + "' produces '" + p.type() + "@" + p.version() + "' but no matching entry exists in events[]"
                    );
                }

                if (!"success".equals(p.when())) {
                    throw new IllegalStateException(
                        "Command '" + cmd.name() + "@" + cmd.version() + "' has invalid produces.when='" + p.when() + "' (must be 'success')"
                    );
                }
            }
        }
    }

    private List<EventContract> scanEvents(String basePackage) {
        List<EventContract> events = new ArrayList<>();
        try {
            ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
            scanner.addIncludeFilter(new AnnotationTypeFilter(SpasEvent.class));

            Set<BeanDefinition> candidates = scanner.findCandidateComponents(basePackage);
            for (BeanDefinition bd : candidates) {
                String className = bd.getBeanClassName();
                if (className == null) continue;

                Class<?> clazz;
                try {
                    clazz = Class.forName(className);
                } catch (ClassNotFoundException e) {
                    continue;
                }

                SpasEvent evt = clazz.getAnnotation(SpasEvent.class);
                if (evt == null) continue;

                String kebabType = KebabCaseConverter.toKebabCase(evt.type());
                String schemaRef;
                if (evt.schemaRef() == null || evt.schemaRef().isBlank()) {
                    String kebabSchemaName = KebabCaseConverter.toKebabCase(clazz.getSimpleName());
                    if (kebabSchemaName == null || kebabSchemaName.isBlank()) {
                        kebabSchemaName = kebabType;
                    }
                    schemaRef = "schemas/events/" + kebabSchemaName + ".schema.json";
                } else {
                    schemaRef = evt.schemaRef();
                }

                String description = evt.description() == null || evt.description().isBlank() ? null : evt.description();
                events.add(new EventContract(kebabType, evt.version(), schemaRef, description));
            }
        } catch (Exception e) {
            log.log(Level.FINE, "Failed to scan events", e);
        }

        return events;
    }

    private List<EndpointContract> scanEndpoints(String basePackage, Protocol defaultProtocol) {
        List<EndpointContract> endpoints = new ArrayList<>();

        try {
            ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
            scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));

            Set<BeanDefinition> candidates = scanner.findCandidateComponents(basePackage);
            for (BeanDefinition bd : candidates) {
                String className = bd.getBeanClassName();
                if (className == null) continue;

                Class<?> controllerClass;
                try {
                    controllerClass = Class.forName(className);
                } catch (ClassNotFoundException e) {
                    continue;
                }

                String[] classPaths = extractPaths(controllerClass.getAnnotation(RequestMapping.class));
                if (classPaths.length == 0) {
                    classPaths = new String[]{""};
                }

                for (Method method : controllerClass.getDeclaredMethods()) {
                    SpasCommand cmd = method.getAnnotation(SpasCommand.class);
                    SpasQuery qry = method.getAnnotation(SpasQuery.class);
                    if (cmd == null && qry == null) {
                        continue;
                    }

                    String[] methodPaths = extractMethodMappingPaths(method);
                    String methodPath = null;
                    if (methodPaths.length > 0) {
                        methodPath = joinPaths(classPaths[0], methodPaths[0]);
                    }

                    if (cmd != null) {
                        String kebabName = KebabCaseConverter.toKebabCase(cmd.name());
                        String schemaRef = (cmd.schemaRef() == null || cmd.schemaRef().isBlank())
                            ? inferEndpointSchemaRef(method, kebabName)
                            : cmd.schemaRef();
                        String description = cmd.description() == null || cmd.description().isBlank() ? null : cmd.description();

                        endpoints.add(new EndpointContract(
                            kebabName,
                            EndpointType.COMMAND,
                            defaultProtocol,
                            methodPath != null ? methodPath : cmd.path(),
                            cmd.version(),
                            schemaRef,
                            description
                        ));
                    }

                    if (qry != null) {
                        String kebabName = KebabCaseConverter.toKebabCase(qry.name());
                        String schemaRef = (qry.schemaRef() == null || qry.schemaRef().isBlank())
                            ? inferEndpointSchemaRef(method, kebabName)
                            : qry.schemaRef();
                        String description = qry.description() == null || qry.description().isBlank() ? null : qry.description();

                        endpoints.add(new EndpointContract(
                            kebabName,
                            EndpointType.QUERY,
                            defaultProtocol,
                            methodPath != null ? methodPath : qry.path(),
                            qry.version(),
                            schemaRef,
                            description
                        ));
                    }
                }
            }
        } catch (Exception e) {
            log.log(Level.FINE, "Failed to scan endpoints", e);
        }

        return endpoints;
    }

    private List<CommandContract> scanCommands(String basePackage) {
        Map<String, Map<String, ProducedEventRef>> producesByCommandKey = new LinkedHashMap<>();

        try {
            ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
            scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));

            Set<BeanDefinition> candidates = scanner.findCandidateComponents(basePackage);
            for (BeanDefinition bd : candidates) {
                String className = bd.getBeanClassName();
                if (className == null) continue;

                Class<?> controllerClass;
                try {
                    controllerClass = Class.forName(className);
                } catch (ClassNotFoundException e) {
                    continue;
                }

                for (Method method : controllerClass.getDeclaredMethods()) {
                    SpasCommand cmd = method.getAnnotation(SpasCommand.class);
                    if (cmd == null) {
                        continue;
                    }

                    String kebabName = KebabCaseConverter.toKebabCase(cmd.name());
                    String version = cmd.version();
                    String commandKey = kebabName + "@" + version;

                    Map<String, ProducedEventRef> produced = producesByCommandKey.computeIfAbsent(commandKey, _k -> new LinkedHashMap<>());

                    for (ProducedEventRef p : resolveProducedEvents(cmd.produces(), kebabName, version)) {
                        String key = p.type() + "|" + p.version();
                        if (produced.containsKey(key)) {
                            throw new IllegalStateException(
                                "Command '" + kebabName + "@" + version + "' declares duplicate produced event '" + p.type() + "@" + p.version() + "'"
                            );
                        }
                        produced.put(key, p);
                    }
                }
            }
        } catch (Exception e) {
            log.log(Level.FINE, "Failed to scan commands", e);
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

    private List<ProducedEventRef> resolveProducedEvents(Class<?>[] producedEventClasses, String commandName, String commandVersion) {
        if (producedEventClasses == null || producedEventClasses.length == 0) {
            return List.of();
        }

        List<ProducedEventRef> produced = new ArrayList<>();

        for (Class<?> eventClass : producedEventClasses) {
            if (eventClass == null) continue;

            SpasEvent evt = eventClass.getAnnotation(SpasEvent.class);
            if (evt == null) {
                throw new IllegalStateException(
                    "Command '" + commandName + "@" + commandVersion + "' declares produced event class '" + eventClass.getName() + "' but it is missing @SpasEvent"
                );
            }

            String type = KebabCaseConverter.toKebabCase(evt.type());
            String version = evt.version();

            if (type == null || type.isBlank()) {
                throw new IllegalStateException(
                    "Command '" + commandName + "@" + commandVersion + "' references @SpasEvent on '" + eventClass.getName() + "' but event type is blank"
                );
            }
            if (version == null || version.isBlank()) {
                throw new IllegalStateException(
                    "Command '" + commandName + "@" + commandVersion + "' references @SpasEvent on '" + eventClass.getName() + "' but event version is blank"
                );
            }

            produced.add(new ProducedEventRef(type, version, "success"));
        }

        return produced;
    }

    private String inferEndpointSchemaRef(Method handlerMethod, String fallbackKebabEndpointName) {
        Class<?> schemaType = resolveSchemaTypeFromMethod(handlerMethod);
        if (schemaType != null) {
            String kebabTypeName = KebabCaseConverter.toKebabCase(schemaType.getSimpleName());
            if (!kebabTypeName.isBlank()) {
                return "schemas/endpoints/" + kebabTypeName + ".schema.json";
            }
        }

        return "schemas/endpoints/" + fallbackKebabEndpointName + ".schema.json";
    }

    private Class<?> findServiceClass() {
        try {
            String[] commonBases = {"io", "com", "org", "net"};

            for (String base : commonBases) {
                ClassPathScanningCandidateComponentProvider scanner =
                    new ClassPathScanningCandidateComponentProvider(false);
                scanner.addIncludeFilter(new AnnotationTypeFilter(SpasService.class));

                Set<BeanDefinition> candidates = scanner.findCandidateComponents(base);
                if (!candidates.isEmpty()) {
                    String className = candidates.iterator().next().getBeanClassName();
                    if (className != null) {
                        try {
                            return Class.forName(className);
                        } catch (ClassNotFoundException ignored) {
                            // continue
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "Failed to find @SpasService class", e);
        }

        return null;
    }

    private Map<String, String> generateMissingSchemas(Set<String> missingSchemas, ServiceMetadata metadata) {
        Map<String, String> generated = new HashMap<>();

        try {
            String basePackage = findBasePackage();
            if (basePackage == null) {
                log.warning("Could not determine base package for schema scanning");
                return generated;
            }

            log.fine("Scanning package " + basePackage + " for annotated types");

            ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
            scanner.addIncludeFilter(new AnnotationTypeFilter(SpasEvent.class));

            Set<BeanDefinition> candidates = scanner.findCandidateComponents(basePackage);

            for (BeanDefinition bd : candidates) {
                try {
                    Class<?> clazz = Class.forName(bd.getBeanClassName());
                    SpasEvent eventAnnotation = clazz.getAnnotation(SpasEvent.class);

                    if (eventAnnotation != null) {
                        String schemaRef = eventAnnotation.schemaRef();
                        if (schemaRef == null || schemaRef.isBlank()) {
                            String kebabSchemaName = KebabCaseConverter.toKebabCase(clazz.getSimpleName());
                            if (kebabSchemaName == null || kebabSchemaName.isBlank()) {
                                String kebabType = KebabCaseConverter.toKebabCase(eventAnnotation.type());
                                kebabSchemaName = kebabType;
                            }

                            schemaRef = "schemas/events/" + kebabSchemaName + ".schema.json";
                        }

                        if (missingSchemas.contains(schemaRef)) {
                            String schema = schemaGenerator.generateSchema(clazz);
                            generated.put(schemaRef, schema);
                            log.fine("Generated schema for " + schemaRef + " from " + clazz.getSimpleName());
                        }
                    }
                } catch (ClassNotFoundException e) {
                    log.warning("Could not load class: " + bd.getBeanClassName());
                }
            }

            if (metadata != null && metadata.endpoints() != null) {
                Map<String, Method> routeToMethod = scanHttpHandlers(basePackage);
                for (EndpointContract endpoint : metadata.endpoints()) {
                    if (endpoint == null || endpoint.schemaRef() == null || endpoint.schemaRef().isBlank()) {
                        continue;
                    }

                    String schemaRef = endpoint.schemaRef();
                    if (!missingSchemas.contains(schemaRef) || generated.containsKey(schemaRef)) {
                        continue;
                    }

                    String routePath = endpoint.methodPath();
                    if (routePath == null || routePath.isBlank()) {
                        continue;
                    }

                    Method handlerMethod = routeToMethod.get(routePath);
                    if (handlerMethod == null) {
                        continue;
                    }

                    Class<?> schemaType = resolveSchemaTypeFromMethod(handlerMethod);
                    if (schemaType == null) {
                        continue;
                    }

                    String schema = schemaGenerator.generateSchema(schemaType);
                    generated.put(schemaRef, schema);
                    log.fine("Generated endpoint schema for " + schemaRef + " from " + handlerMethod.getDeclaringClass().getSimpleName() + "#" + handlerMethod.getName());
                }
            }

            for (String missing : missingSchemas) {
                if (!generated.containsKey(missing)) {
                    log.warning("Could not generate schema for: " + missing +
                        ". Create the file or annotate a class with @SpasEvent(schemaRef=\"" + missing + "\")");
                }
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "Failed to generate schemas dynamically", e);
        }

        return generated;
    }

    private Map<String, Method> scanHttpHandlers(String basePackage) {
        Map<String, Method> routeToMethod = new HashMap<>();

        try {
            ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
            scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));

            Set<BeanDefinition> candidates = scanner.findCandidateComponents(basePackage);
            for (BeanDefinition bd : candidates) {
                String className = bd.getBeanClassName();
                if (className == null) continue;

                Class<?> controllerClass;
                try {
                    controllerClass = Class.forName(className);
                } catch (ClassNotFoundException e) {
                    continue;
                }

                String[] classPaths = extractPaths(controllerClass.getAnnotation(RequestMapping.class));
                if (classPaths.length == 0) {
                    classPaths = new String[]{""};
                }

                for (Method method : controllerClass.getDeclaredMethods()) {
                    String[] methodPaths = extractMethodMappingPaths(method);
                    if (methodPaths.length == 0) {
                        continue;
                    }

                    for (String cp : classPaths) {
                        for (String mp : methodPaths) {
                            String full = joinPaths(cp, mp);
                            routeToMethod.putIfAbsent(full, method);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.log(Level.FINE, "Failed to scan HTTP handlers", e);
        }

        return routeToMethod;
    }

    private String[] extractMethodMappingPaths(Method method) {
        for (Annotation ann : method.getAnnotations()) {
            String annName = ann.annotationType().getName();
            if (annName.equals("org.springframework.web.bind.annotation.GetMapping")
                || annName.equals("org.springframework.web.bind.annotation.PostMapping")
                || annName.equals("org.springframework.web.bind.annotation.PutMapping")
                || annName.equals("org.springframework.web.bind.annotation.DeleteMapping")
                || annName.equals("org.springframework.web.bind.annotation.PatchMapping")
                || annName.equals("org.springframework.web.bind.annotation.RequestMapping")) {
                String[] paths = extractPaths(ann);
                return paths.length > 0 ? paths : new String[]{""};
            }
        }
        return new String[0];
    }

    private String[] extractPaths(Annotation mappingAnnotation) {
        if (mappingAnnotation == null) {
            return new String[0];
        }

        try {
            Method pathMethod = mappingAnnotation.annotationType().getMethod("path");
            Object value = pathMethod.invoke(mappingAnnotation);
            if (value instanceof String[] arr && arr.length > 0) {
                return arr;
            }
        } catch (Exception ignored) {
            // ignore
        }

        try {
            Method valueMethod = mappingAnnotation.annotationType().getMethod("value");
            Object value = valueMethod.invoke(mappingAnnotation);
            if (value instanceof String[] arr && arr.length > 0) {
                return arr;
            }
        } catch (Exception ignored) {
            // ignore
        }

        return new String[0];
    }

    private String joinPaths(String base, String sub) {
        String b = base == null ? "" : base.trim();
        String s = sub == null ? "" : sub.trim();

        if (b.isEmpty()) {
            return s.startsWith("/") ? s : "/" + s;
        }
        if (s.isEmpty()) {
            return b.startsWith("/") ? b : "/" + b;
        }

        String bNorm = b.endsWith("/") ? b.substring(0, b.length() - 1) : b;
        String sNorm = s.startsWith("/") ? s : "/" + s;
        String joined = bNorm + sNorm;
        return joined.startsWith("/") ? joined : "/" + joined;
    }

    private Class<?> resolveSchemaTypeFromMethod(Method method) {
        for (java.lang.reflect.Parameter parameter : method.getParameters()) {
            if (parameter.getAnnotation(RequestBody.class) != null) {
                return parameter.getType();
            }
        }

        Class<?> returnType = method.getReturnType();
        if (returnType == null || returnType == Void.TYPE) {
            return null;
        }

        if ("org.springframework.http.ResponseEntity".equals(returnType.getName())) {
            Type generic = method.getGenericReturnType();
            if (generic instanceof ParameterizedType pt) {
                Type[] args = pt.getActualTypeArguments();
                if (args.length == 1 && args[0] instanceof Class<?> c) {
                    return c;
                }
            }
        }

        return returnType;
    }

    private String findBasePackage() {
        try {
            String[] commonBases = {"io", "com", "org", "net"};

            for (String base : commonBases) {
                ClassPathScanningCandidateComponentProvider scanner =
                    new ClassPathScanningCandidateComponentProvider(false);
                scanner.addIncludeFilter(new AnnotationTypeFilter(SpasService.class));

                Set<BeanDefinition> candidates = scanner.findCandidateComponents(base);
                if (!candidates.isEmpty()) {
                    String className = candidates.iterator().next().getBeanClassName();
                    if (className != null) {
                        int lastDot = className.lastIndexOf('.');
                        if (lastDot > 0) {
                            String pkg = className.substring(0, lastDot);
                            int secondLastDot = pkg.lastIndexOf('.');
                            return secondLastDot > 0 ? pkg.substring(0, secondLastDot) : pkg;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "Failed to find base package", e);
        }
        return null;
    }
}
