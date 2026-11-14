package com.heyganba;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heyganba.model.entity.Role;
import com.heyganba.model.enums.RoleName;
import com.heyganba.support.ContentApiTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class NotebookAliasSecurityTest extends ContentApiTestBase {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @BeforeEach void roles(){roleRepository.save(Role.builder().name(RoleName.ROLE_USER).build());}
    @Test void everyNotebookAliasOperationRequiresAuthenticationBeforeControllerExecution() throws Exception {
        for(String prefix:new String[]{"/notebooks","/vocab/notebooks"}) {
            for(String[] route:new String[][]{{"GET",""},{"GET","/1"},{"POST",""},{"DELETE","/1"},
                    {"POST","/1/items"},{"PUT","/1/items/1"},{"DELETE","/1/items/1"},
                    {"POST","/clone-sample/1"},{"POST","/1/practice-result"}}) {
                mvc.perform(request(HttpMethod.valueOf(route[0]),prefix+route[1])
                        .contentType("application/json").content("{}"))
                        .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
            }
        }
    }
    private String account(String email) throws Exception {
        return json.readTree(mvc.perform(post("/auth/register").contentType("application/json")
                .content(json.writeValueAsBytes(Map.of("email",email,"fullName","Alias fixture","password","AliasFixture123!"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).at("/data/accessToken").asText();
    }
    @Test void legacyAliasRetainsOwnerAccessWithoutGrantingAnotherUserAccess() throws Exception {
        String a=account("alias-a@jiayou.test"),b=account("alias-b@jiayou.test");
        long id=json.readTree(mvc.perform(post("/vocab/notebooks").header("Authorization","Bearer "+a)
                .contentType("application/json").content("{\"title\":\"Private fixture\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).at("/data/id").asLong();
        mvc.perform(get("/vocab/notebooks/"+id).header("Authorization","Bearer "+a))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.title").value("Private fixture"));
        mvc.perform(get("/vocab/notebooks/"+id).header("Authorization","Bearer "+b)).andExpect(status().isNotFound());
        mvc.perform(delete("/vocab/notebooks/"+id).header("Authorization","Bearer "+b)).andExpect(status().isBadRequest());
        mvc.perform(get("/notebooks/"+id).header("Authorization","Bearer "+a)).andExpect(status().isOk());
        mvc.perform(get("/vocab/lessons")).andExpect(status().isOk()); // Public catalog stays public.
    }

    @Test void bothAliasesDenyCrossOwnerMutationsBeforeChangingData() throws Exception {
        String owner=account("alias-owner@jiayou.test"),other=account("alias-other@jiayou.test");
        long id=json.readTree(mvc.perform(post("/notebooks").header("Authorization","Bearer "+owner)
                .contentType("application/json").content("{\"title\":\"Owned notebook\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).at("/data/id").asLong();
        for(String prefix:new String[]{"/notebooks","/vocab/notebooks"}) {
            mvc.perform(post(prefix+"/"+id+"/items").header("Authorization","Bearer "+other)
                    .contentType("application/json").content("{\"vocabularyId\":1,\"customNote\":\"intrusion\"}"))
                    .andExpect(status().isNotFound());
            mvc.perform(put(prefix+"/"+id+"/items/1").header("Authorization","Bearer "+other)
                    .contentType("application/json").content("{\"customNote\":\"intrusion\"}"))
                    .andExpect(status().isNotFound());
            mvc.perform(delete(prefix+"/"+id+"/items/1").header("Authorization","Bearer "+other))
                    .andExpect(status().isNotFound());
            mvc.perform(post(prefix+"/"+id+"/practice-result").header("Authorization","Bearer "+other)
                    .contentType("application/json").content(json.writeValueAsBytes(Map.of(
                            "sessionId",java.util.UUID.randomUUID(),"answers",java.util.List.of(
                                    Map.of("vocabularyId",1,"answer","fixture","kind","MEANING"))))))
                    .andExpect(status().isNotFound());
            mvc.perform(post(prefix+"/clone-sample/"+id).header("Authorization","Bearer "+other))
                    .andExpect(status().isBadRequest());
            mvc.perform(get(prefix+"/"+id).header("Authorization","Bearer "+owner))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data.title").value("Owned notebook"))
                    .andExpect(jsonPath("$.data.items").isEmpty());
        }
        mvc.perform(delete("/vocab/notebooks/"+id).header("Authorization","Bearer "+owner))
                .andExpect(status().isOk());
        mvc.perform(get("/notebooks/"+id).header("Authorization","Bearer "+owner))
                .andExpect(status().isNotFound());
    }
}
