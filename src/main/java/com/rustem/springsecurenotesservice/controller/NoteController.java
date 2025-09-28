package com.rustem.springsecurenotesservice.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
public class NoteController {

    @GetMapping("/notes")
    public List<String> getNotes() {
        return List.of(
                "Buy groceries",
                "Learn Spring Boot",
                "Build secure notes service"
        );
    }
}