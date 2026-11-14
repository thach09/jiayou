package com.heyganba.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank @Size(max = 50) @com.heyganba.common.validation.BcryptPassword String currentPassword,
        @NotBlank @Size(min = 6, max = 50) @com.heyganba.common.validation.BcryptPassword String newPassword,
        @Size(max = 4096) String refreshToken) {}
