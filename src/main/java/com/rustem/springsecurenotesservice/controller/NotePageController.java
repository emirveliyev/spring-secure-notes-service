package com.rustem.springsecurenotesservice.controller;

import com.rustem.springsecurenotesservice.model.Note;
import com.rustem.springsecurenotesservice.repository.NoteRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@Controller
public class NotePageController {

    private final NoteRepository repo;

    public NotePageController(NoteRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("notes", repo.findAll());
        return "index";
    }

    @PostMapping("/notes/add")
    public String add(@RequestParam String text, @RequestParam(required = false) String author) {
        Note n = Note.builder()
                .text(text)
                .author(author == null || author.isBlank() ? "Аноним" : author)
                .build();
        repo.save(n);
        return "redirect:/";
    }

    @GetMapping("/notes/delete/{id}")
    public String delete(@PathVariable Long id) {
        repo.deleteById(id);
        return "redirect:/";
    }

    @PostMapping("/notes/update/{id}")
    public String update(@PathVariable Long id, @RequestParam String text) {
        Optional<Note> maybe = repo.findById(id);
        if (maybe.isPresent()) {
            Note n = maybe.get();
            n.setText(text);
            repo.save(n);
        }
        return "redirect:/";
    }
}