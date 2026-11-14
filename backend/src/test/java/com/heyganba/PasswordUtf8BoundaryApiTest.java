package com.heyganba;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heyganba.model.entity.Role;
import com.heyganba.model.enums.RoleName;
import com.heyganba.support.ContentApiTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PasswordUtf8BoundaryApiTest extends ContentApiTestBase {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    private static final String EMAIL="utf8-boundary@jiayou.test";
    private static final String EXACT="界".repeat(24); // 72 UTF-8 bytes, 24 characters.
    private static final String OVER="界".repeat(25); // 75 bytes, still below the character cap.
    @BeforeEach void roles(){roleRepository.save(Role.builder().name(RoleName.ROLE_USER).build());}
    private String register(String password) throws Exception {
        return json.readTree(mvc.perform(post("/auth/register").contentType("application/json")
                .content(json.writeValueAsBytes(Map.of("email",EMAIL,"fullName","UTF8 fixture","password",password))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).at("/data/accessToken").asText();
    }
    @Test void rejectsTooManyBytesBeforeRegistrationWritesAnything() throws Exception {
        mvc.perform(post("/auth/register").contentType("application/json")
                .content(json.writeValueAsBytes(Map.of("email",EMAIL,"fullName","UTF8 fixture","password",OVER))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.password").exists());
        assertThat(userRepository.findByEmail(EMAIL)).isEmpty();
    }
    @Test void acceptsExactly72BytesAndAuthenticatesWithoutTruncation() throws Exception {
        register(EXACT);
        mvc.perform(post("/auth/login").contentType("application/json")
                .content(json.writeValueAsBytes(Map.of("email",EMAIL,"password",EXACT)))).andExpect(status().isOk());
        mvc.perform(post("/auth/login").contentType("application/json")
                .content(json.writeValueAsBytes(Map.of("email",EMAIL,"password",EXACT+"x")))).andExpect(status().isBadRequest());
    }
    @Test void invalidReplacementKeepsCurrentPasswordAndSessionValid() throws Exception {
        String token=register("BeforeBoundary123!");
        String hash=userRepository.findByEmail(EMAIL).orElseThrow().getPasswordHash();
        mvc.perform(put("/auth/password").header("Authorization","Bearer "+token).contentType("application/json")
                .content(json.writeValueAsBytes(Map.of("currentPassword","BeforeBoundary123!","newPassword",OVER))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.newPassword").exists());
        assertThat(userRepository.findByEmail(EMAIL).orElseThrow().getPasswordHash()).isEqualTo(hash);
        mvc.perform(get("/users/me").header("Authorization","Bearer "+token)).andExpect(status().isOk());
    }
    @Test void exactly72ByteReplacementWorksAndRevokesOldSession() throws Exception {
        String token=register("BeforeBoundary123!");
        mvc.perform(put("/auth/password").header("Authorization","Bearer "+token).contentType("application/json")
                .content(json.writeValueAsBytes(Map.of("currentPassword","BeforeBoundary123!","newPassword",EXACT))))
                .andExpect(status().isOk());
        mvc.perform(get("/users/me").header("Authorization","Bearer "+token)).andExpect(status().isUnauthorized());
        mvc.perform(post("/auth/login").contentType("application/json")
                .content(json.writeValueAsBytes(Map.of("email",EMAIL,"password",EXACT)))).andExpect(status().isOk());
    }

    @Test void emojiBoundaryUsesUtf8BytesAndRejectsExtraCodePoint() throws Exception {
        String exactEmoji="🦊".repeat(18); // 72 UTF-8 bytes, 36 UTF-16 code units.
        register(exactEmoji);
        mvc.perform(post("/auth/login").contentType("application/json")
                .content(json.writeValueAsBytes(Map.of("email",EMAIL,"password",exactEmoji))))
                .andExpect(status().isOk());
        mvc.perform(post("/auth/login").contentType("application/json")
                .content(json.writeValueAsBytes(Map.of("email",EMAIL,"password",exactEmoji+"🦊"))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.password").exists());
    }

    @Test void overlongCurrentPasswordCannotAuthorizeChangeOrRevokeSession() throws Exception {
        String token=register(EXACT);
        String hash=userRepository.findByEmail(EMAIL).orElseThrow().getPasswordHash();
        mvc.perform(put("/auth/password").header("Authorization","Bearer "+token).contentType("application/json")
                .content(json.writeValueAsBytes(Map.of("currentPassword",EXACT+"x","newPassword","Replacement123!"))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.currentPassword").exists());
        assertThat(userRepository.findByEmail(EMAIL).orElseThrow().getPasswordHash()).isEqualTo(hash);
        mvc.perform(get("/users/me").header("Authorization","Bearer "+token)).andExpect(status().isOk());
    }

    @Test void adminConfirmationRejectsByteOverflowWithoutDisablingTwoFactor() throws Exception {
        String token=adminAccessToken("utf8-admin@jiayou.test");
        var admin=userRepository.findByEmail("utf8-admin@jiayou.test").orElseThrow();
        admin.setPasswordHash(passwordEncoder.encode(EXACT));
        admin.setTwoFactorSecret("JBSWY3DPEHPK3PXP");
        admin.setIsTwoFactorEnabled(true);
        userRepository.save(admin);
        for (String invalid:new String[]{EXACT+"x",OVER,"🦊".repeat(19)}) {
            mvc.perform(post("/admin/2fa/reset").header("Authorization","Bearer "+token)
                    .contentType("application/json").content(json.writeValueAsBytes(Map.of("password",invalid))))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.password").exists());
            var retained=userRepository.findByEmail("utf8-admin@jiayou.test").orElseThrow();
            assertThat(retained.getIsTwoFactorEnabled()).isTrue();
            assertThat(retained.getTwoFactorSecret()).isEqualTo("JBSWY3DPEHPK3PXP");
        }
        mvc.perform(post("/admin/2fa/reset").header("Authorization","Bearer "+token)
                .contentType("application/json").content(json.writeValueAsBytes(Map.of("password",EXACT))))
                .andExpect(status().isOk());
        assertThat(userRepository.findByEmail("utf8-admin@jiayou.test").orElseThrow().getIsTwoFactorEnabled()).isFalse();
    }
}
