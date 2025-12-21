package io.spas.sdk.spring;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.spas.sdk.core.util.KebabCaseConverter;
import io.spas.sdk.metadata.JacksonConfiguration;
import io.spas.sdk.metadata.annotations.SpasCommand;
import io.spas.sdk.metadata.model.EndpointContract;
import io.spas.sdk.metadata.model.EndpointType;
import io.spas.sdk.metadata.model.EventContract;
import io.spas.sdk.metadata.model.Protocol;
import io.spas.sdk.metadata.model.Consistency;
import io.spas.sdk.metadata.model.ConsistencyLevel;
import io.spas.sdk.metadata.model.QueryConsistencyLevel;
import io.spas.sdk.metadata.model.Security;
import io.spas.sdk.metadata.model.Authentication;
import io.spas.sdk.metadata.model.AuthType;
import io.spas.sdk.metadata.model.DataClassification;
import io.spas.sdk.metadata.model.ServiceMetadata;
import io.spas.sdk.metadata.model.Network;
import io.spas.sdk.metadata.annotations.SpasEvent;
import io.spas.sdk.metadata.annotations.SpasQuery;
import io.spas.sdk.metadata.annotations.SpasService;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.lang.reflect.Method;
import java.lang.annotation.Annotation;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * REST controller that exposes SPAS service metadata at /_spas/metadata.
 * 
 * <p>Returns a ZIP archive containing:</p>
 * <ul>
 *   <li>spas.json - The service metadata generated at runtime</li>
 *   <li>schemas/*.json - Contract schemas for commands, queries, and events</li>
 * </ul>
 * 
 * <p>Schema resolution strategy:</p>
 * <ol>
 *   <li>First, looks for pre-generated schema files in classpath (schemas/*.json)</li>
 *   <li>If not found, generates schemas dynamically from annotated Java types</li>
 * </ol>
 * 
 * <p>This endpoint is used by:</p>
 * <ul>
 *   <li>spas-service CLI to fetch and publish metadata to the repository</li>
 *   <li>Development tools for service introspection</li>
 *   <li>Sidecar for runtime contract validation</li>
 * </ul>
 * 
 * <p>The endpoint can be disabled via configuration:
 * {@code spas.metadata.enabled=false}</p>
 */
@RestController
@RequestMapping("/_spas")
public class SpasMetadataController {

    private static final Logger log = Logger.getLogger(SpasMetadataController.class.getName());
    private static final String SPAS_JSON_ENTRY = "spas.json";
    private static final String SCHEMAS_PATTERN = "classpath*:schemas/**/*.json";

    private final SpasProperties properties;
    private final SpasSchemaGenerator schemaGenerator;
    private final ObjectMapper objectMapper;
    private volatile byte[] cachedArchive;

    public SpasMetadataController(SpasProperties properties) {
        this.properties = properties;
        this.schemaGenerator = new SpasSchemaGenerator();
        this.objectMapper = JacksonConfiguration.getObjectMapper();
    }

    /**
     * Returns the service metadata as a ZIP archive containing spas.json and schemas.
     * 
     * @return ZIP archive with spas.json and schema files.
     */
    @GetMapping(value = "/metadata", produces = "application/zip")
    public ResponseEntity<byte[]> getMetadata() {
        // Check if metadata endpoint is enabled
        if (!properties.getMetadata().isEnabled()) {
            return ResponseEntity.status(404)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body("{\"error\": \"Metadata endpoint is disabled\", \"hint\": \"Set spas.metadata.enabled=true to enable\"}".getBytes(StandardCharsets.UTF_8));
        }

        // Check environment restriction if configured
        String allowedEnv = properties.getMetadata().getAllowedEnvironment();
        if (allowedEnv != null && !allowedEnv.isBlank()) {
            String currentEnv = System.getenv("SPRING_PROFILES_ACTIVE");
            if (currentEnv == null) {
                currentEnv = System.getProperty("spring.profiles.active", "default");
            }

            if (!isEnvironmentAllowed(allowedEnv, currentEnv)) {
                return ResponseEntity.status(404)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .body(("{\"error\": \"Metadata endpoint is not available in this environment\", " +
                          "\"environment\": \"" + currentEnv + "\", " +
                          "\"hint\": \"Enable in " + allowedEnv + " mode\"}").getBytes(StandardCharsets.UTF_8));
            }
        }

        try {
            // Use cached archive if available
            if (cachedArchive != null) {
                return buildZipResponse(cachedArchive);
            }

            ServiceMetadata metadata = buildMetadataAtRuntime();
            if (metadata == null) {
                log.warning("No @SpasService found on classpath; cannot generate spas.json at runtime.");
                return ResponseEntity.status(404)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .body("{\"error\": \"@SpasService not found\", \"hint\": \"Annotate your service application/config class with @SpasService\"}".getBytes(StandardCharsets.UTF_8));
            }

            String spasJsonContent = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(metadata);

            // Create ZIP archive
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (ZipOutputStream zos = new ZipOutputStream(baos)) {
                // Add spas.json (generated at runtime)
                addStringToZip(zos, SPAS_JSON_ENTRY, spasJsonContent);

                // Collect schemas - first try classpath, then generate dynamically
                Map<String, String> schemas = collectSchemas(metadata);
                
                for (Map.Entry<String, String> entry : schemas.entrySet()) {
                    addStringToZip(zos, entry.getKey(), entry.getValue());
                }
                
                log.fine("Added " + schemas.size() + " schemas to archive");
            }

            byte[] archive = baos.toByteArray();
            
            // Cache the archive since it's effectively static (derived from annotations)
            cachedArchive = archive;
            
            log.fine("Serving metadata archive (" + archive.length + " bytes)");
            return buildZipResponse(archive);

        } catch (IOException e) {
            log.log(Level.SEVERE, "Failed to create metadata archive", e);
            return ResponseEntity.internalServerError()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(("{\"error\": \"Failed to create metadata archive\", \"message\": \"" + 
                      e.getMessage().replace("\"", "'") + "\"}").getBytes(StandardCharsets.UTF_8));
        }
    }

    private ResponseEntity<byte[]> buildZipResponse(byte[] archive) {
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, "application/zip")
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"spas-metadata.zip\"")
            .body(archive);
    }

    private void addStringToZip(ZipOutputStream zos, String entryName, String content) throws IOException {
        ZipEntry entry = new ZipEntry(entryName);
        zos.putNextEntry(entry);
        zos.write(content.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }

    private boolean isEnvironmentAllowed(String allowedEnv, String currentEnv) {
        if (allowedEnv == null || allowedEnv.isBlank()) {
            return true;
        }
        if ("*".equalsIgnoreCase(allowedEnv)) {
            return true;
        }

        String normalizedAllowed = normalizeEnvName(allowedEnv);

        // Spring can supply a comma-separated list of active profiles
        for (String part : currentEnv.split(",")) {
            String normalizedCurrent = normalizeEnvName(part);
            if (normalizedAllowed.equalsIgnoreCase(normalizedCurrent)) {
                return true;
            }
        }

        return false;
    }

    private String normalizeEnvName(String env) {
        String trimmed = env == null ? "" : env.trim();
        if (trimmed.equalsIgnoreCase("dev")) return "development";
        if (trimmed.equalsIgnoreCase("development")) return "development";
        return trimmed;
    }

    /**
     * Collects schemas from classpath or generates them dynamically.
     * 
     * <p>Strategy:</p>
     * <ol>
     *   <li>Parse spas.json to find all schemaRef values</li>
     *   <li>For each schemaRef, try to load from classpath</li>
     *   <li>If not found in classpath, scan for annotated types and generate</li>
     * </ol>
     */
    private Map<String, String> collectSchemas(ServiceMetadata metadata) {
        Map<String, String> schemas = new HashMap<>();
        
        try {
            Set<String> schemaRefs = extractSchemaRefs(metadata);
            
            if (schemaRefs.isEmpty()) {
                log.fine("No schema references found in spas.json");
                return schemas;
            }
            
            log.fine("Found " + schemaRefs.size() + " schema references in spas.json");
            
            // Try to load each schema from classpath first
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
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
            
            // Generate missing schemas dynamically
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

    /**
     * Extracts all schemaRef values from spas.json.
     */
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

            return new ServiceMetadata(
                ServiceMetadata.SCHEMA_VERSION,
                service.id(),
                service.name(),
                description,
                service.version(),
                service.boundedContext(),
                capabilities,
                endpoints,
                events,
                consistency,
                security,
                network,
                license
            );
        } catch (Exception e) {
            log.log(Level.WARNING, "Failed to build spas.json metadata at runtime", e);
            return null;
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

    /**
     * Generates schemas for schema references that weren't found in classpath.
     * Scans for classes annotated with @SpasEvent that match the schema refs.
     */
    private Map<String, String> generateMissingSchemas(Set<String> missingSchemas, ServiceMetadata metadata) {
        Map<String, String> generated = new HashMap<>();
        
        try {
            // Find the base package by scanning for @SpasService
            String basePackage = findBasePackage();
            if (basePackage == null) {
                log.warning("Could not determine base package for schema scanning");
                return generated;
            }
            
            log.fine("Scanning package " + basePackage + " for annotated types");
            
            // Scan for classes with @SpasEvent annotation (events are RUNTIME-retained)
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

            // Generate endpoint schemas by scanning @RestController classes and mapping annotations (spring-web only)
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
            
            // Log any schemas we couldn't generate
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
                            // Prefer first discovered mapping
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
                // If no explicit path/value is provided, Spring maps the method to the class-level path.
                // Represent that as an empty path segment so callers can joinPaths(classPath, "").
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

    /**
     * Finds the base package by looking for a class annotated with @SpasService.
     */
    private String findBasePackage() {
        try {
            // Scan common base packages - start broad and narrow down
            String[] commonBases = {"io", "com", "org", "net"};
            
            for (String base : commonBases) {
                ClassPathScanningCandidateComponentProvider scanner = 
                    new ClassPathScanningCandidateComponentProvider(false);
                scanner.addIncludeFilter(new AnnotationTypeFilter(SpasService.class));
                
                Set<BeanDefinition> candidates = scanner.findCandidateComponents(base);
                if (!candidates.isEmpty()) {
                    String className = candidates.iterator().next().getBeanClassName();
                    if (className != null) {
                        // Return package up to the service class
                        int lastDot = className.lastIndexOf('.');
                        if (lastDot > 0) {
                            // Go up one level to get the base package
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
