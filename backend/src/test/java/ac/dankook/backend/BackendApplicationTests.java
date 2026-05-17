package ac.dankook.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = "spring.main.allow-bean-definition-overriding=true"
)
class BackendApplicationTests {

    @Test
    void contextLoads() {
    }

}
