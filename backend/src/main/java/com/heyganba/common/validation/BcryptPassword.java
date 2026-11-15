package com.heyganba.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/** BCrypt's byte limit is independent of the form's character-length limit. */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = BcryptPasswordValidator.class)
public @interface BcryptPassword {
    String message() default "Mật khẩu không được vượt quá 72 byte UTF-8. Vui lòng rút ngắn mật khẩu.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
