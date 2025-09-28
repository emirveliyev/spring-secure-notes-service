package com.rustem.springsecurenotesservice.repository;

import com.rustem.springsecurenotesservice.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteRepository extends JpaRepository<Note, Long> {
}