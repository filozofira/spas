package io.spas.sdk.metadata.processor;

import com.google.testing.compile.Compilation;
import com.google.testing.compile.JavaFileObjects;
import org.junit.jupiter.api.Test;

import javax.tools.JavaFileObject;
import javax.tools.StandardLocation;
import java.io.IOException;

import static com.google.testing.compile.CompilationSubject.assertThat;
import static com.google.testing.compile.Compiler.javac;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SpasAnnotationProcessorTest {

    @Test
    void processor_shouldGenerateSpasJsonForServiceWithCommandsAndEvents() throws IOException {
        JavaFileObject serviceClass = JavaFileObjects.forSourceLines(
            "test.SampleService",
            "package test;",
            "",
            "import io.spas.sdk.metadata.annotations.*;",
            "import io.spas.sdk.metadata.model.*;",
            "",
            "@SpasService(",
            "    id = \"sample-service\",",
            "    name = \"Sample Service\",",
            "    version = \"1.0.0\",",
            "    boundedContext = \"test\"",
            ")",
            "public class SampleService {",
            "    @SpasCommand(",
            "        name = \"CreateOrder\",",
            "        version = \"1.0.0\",",
            "        methodPath = \"POST /api/orders\",",
            "        schemaRef = \"schemas/create-order.json\"",
            "    )",
            "    public void createOrder() {}",
            "",
            "    @SpasQuery(",
            "        name = \"GetOrder\",",
            "        version = \"1.0.0\",",
            "        methodPath = \"GET /api/orders/{id}\",",
            "        schemaRef = \"schemas/order.json\"",
            "    )",
            "    public void getOrder() {}",
            "}"
        );

        JavaFileObject eventClass = JavaFileObjects.forSourceLines(
            "test.OrderCreatedEvent",
            "package test;",
            "",
            "import io.spas.sdk.metadata.annotations.SpasEvent;",
            "",
            "@SpasEvent(",
            "    type = \"OrderCreated\",",
            "    version = \"1.0.0\",",
            "    schemaRef = \"schemas/order-created.json\"",
            ")",
            "public class OrderCreatedEvent {",
            "    private String orderId;",
            "}"
        );

        Compilation compilation = javac()
            .withProcessors(new SpasAnnotationProcessor())
            .compile(serviceClass, eventClass);

        assertThat(compilation).succeeded();
        
        JavaFileObject spasJsonFile2 = compilation.generatedFile(StandardLocation.CLASS_OUTPUT, "spas.json")
            .orElseThrow(() -> new AssertionError("spas.json was not generated"));
        String spasJson2 = new String(spasJsonFile2.openInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        
        assertTrue(spasJson2.contains("\"schema-version\" : \"design-time-metadata-v1\""));
        assertTrue(spasJson2.contains("\"id\" : \"sample-service\""));
        assertTrue(spasJson2.contains("\"create-order\""));  // kebab-case conversion
        assertTrue(spasJson2.contains("\"order-created\""));  // kebab-case conversion
    }

    @Test
    void processor_shouldWarnWhenNoSpasServiceAnnotation() {
        JavaFileObject commandClass = JavaFileObjects.forSourceLines(
            "test.SomeController",
            "package test;",
            "",
            "import io.spas.sdk.metadata.annotations.SpasCommand;",
            "",
            "public class SomeController {",
            "    @SpasCommand(",
            "        name = \"Test\",",
            "        version = \"1.0.0\",",
            "        methodPath = \"POST /test\",",
            "        schemaRef = \"test.json\"",
            "    )",
            "    public void test() {}",
            "}"
        );

        Compilation compilation = javac()
            .withProcessors(new SpasAnnotationProcessor())
            .compile(commandClass);

        assertThat(compilation).succeeded();
        assertThat(compilation).hadWarningContaining("No @SpasService annotation found");
    }

    @Test
    void processor_shouldErrorWhenMultipleSpasServiceAnnotations() {
        JavaFileObject service1 = JavaFileObjects.forSourceLines(
            "test.Service1",
            "package test;",
            "",
            "import io.spas.sdk.metadata.annotations.SpasService;",
            "import io.spas.sdk.metadata.model.Protocol;",
            "",
            "@SpasService(",
            "    id = \"service1\",",
            "    name = \"Service 1\",",
            "    version = \"1.0.0\",",
            "    boundedContext = \"test\"",
            ")",
            "public class Service1 {}"
        );

        JavaFileObject service2 = JavaFileObjects.forSourceLines(
            "test.Service2",
            "package test;",
            "",
            "import io.spas.sdk.metadata.annotations.SpasService;",
            "import io.spas.sdk.metadata.model.Protocol;",
            "",
            "@SpasService(",
            "    id = \"service2\",",
            "    name = \"Service 2\",",
            "    version = \"1.0.0\",",
            "    boundedContext = \"test\"",
            ")",
            "public class Service2 {}"
        );

        Compilation compilation = javac()
            .withProcessors(new SpasAnnotationProcessor())
            .compile(service1, service2);

        assertThat(compilation).failed();
        assertThat(compilation).hadErrorContaining("Multiple @SpasService annotations found");
    }

    @Test
    void processor_shouldHandleServiceWithNoEndpointsOrEvents() throws IOException {
        JavaFileObject serviceClass = JavaFileObjects.forSourceLines(
            "test.MinimalService",
            "package test;",
            "",
            "import io.spas.sdk.metadata.annotations.SpasService;",
            "import io.spas.sdk.metadata.model.Protocol;",
            "",
            "@SpasService(",
            "    id = \"minimal-service\",",
            "    name = \"Minimal Service\",",
            "    version = \"1.0.0\",",
            "    boundedContext = \"test\"",
            ")",
            "public class MinimalService {}"
        );

        Compilation compilation = javac()
            .withProcessors(new SpasAnnotationProcessor())
            .compile(serviceClass);

        assertThat(compilation).succeeded();
        
        JavaFileObject spasJsonFile3 = compilation.generatedFile(StandardLocation.CLASS_OUTPUT, "spas.json")
            .orElseThrow(() -> new AssertionError("spas.json was not generated"));
        String spasJson3 = new String(spasJsonFile3.openInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        
        assertTrue(spasJson3.contains("\"minimal-service\""));
    }

    @Test
    void processor_shouldConvertEndpointAndEventNamesToKebabCase() throws IOException {
        JavaFileObject serviceClass = JavaFileObjects.forSourceLines(
            "test.KebabTestService",
            "package test;",
            "",
            "import io.spas.sdk.metadata.annotations.*;",
            "import io.spas.sdk.metadata.model.Protocol;",
            "",
            "@SpasService(",
            "    id = \"test-service\",",
            "    name = \"Test\",",
            "    version = \"1.0.0\",",
            "    boundedContext = \"test\"",
            ")",
            "public class KebabTestService {",
            "    @SpasCommand(",
            "        name = \"CreateOrderItem\",",  // Should become create-order-item
            "        version = \"1.0.0\",",
            "        methodPath = \"POST /test\",",
            "        schemaRef = \"test.json\"",
            "    )",
            "    public void test() {}",
            "}"
        );

        JavaFileObject eventClass = JavaFileObjects.forSourceLines(
            "test.HTTPRequestReceived",
            "package test;",
            "",
            "import io.spas.sdk.metadata.annotations.SpasEvent;",
            "",
            "@SpasEvent(",
            "    type = \"HTTPRequestReceived\",",  // Should become http-request-received
            "    version = \"1.0.0\",",
            "    schemaRef = \"test.json\"",
            ")",
            "public class HTTPRequestReceived {}"
        );

        Compilation compilation = javac()
            .withProcessors(new SpasAnnotationProcessor())
            .compile(serviceClass, eventClass);

        assertThat(compilation).succeeded();
        
        JavaFileObject spasJsonFile = compilation.generatedFile(StandardLocation.CLASS_OUTPUT, "spas.json")
            .orElseThrow(() -> new AssertionError("spas.json was not generated"));
        
        String spasJson = new String(spasJsonFile.openInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        
        assertTrue(spasJson.contains("\"create-order-item\""));
        assertTrue(spasJson.contains("\"http-request-received\""));
    }
}
