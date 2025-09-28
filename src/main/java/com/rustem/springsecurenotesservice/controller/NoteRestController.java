package com.rustem.springsecurenotesservice.controller;

import com.rustem.springsecurenotesservice.model.Note;
import com.rustem.springsecurenotesservice.repository.NoteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteRestController {

    private final NoteRepository repo;

    public NoteRestController(NoteRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Note> all() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Note> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Note> create(@RequestBody Note note) {
        Note saved = repo.save(note);
        return ResponseEntity.created(URI.create("/api/notes/" + saved.getId())).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Note> update(@PathVariable Long id, @RequestBody Note note) {
        return repo.findById(id)
                .map(existing -> {
                    existing.setText(note.getText());
                    existing.setAuthor(note.getAuthor());
                    Note updated = repo.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return repo.findById(id)
                .map(n -> {
                    repo.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}