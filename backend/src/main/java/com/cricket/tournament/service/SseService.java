package com.cricket.tournament.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SseService {

    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();

    public SseEmitter subscribe(Long matchId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.computeIfAbsent(matchId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(matchId, emitter));
        emitter.onTimeout(() -> remove(matchId, emitter));
        emitter.onError(e -> remove(matchId, emitter));

        return emitter;
    }

    public void broadcast(Long matchId, Object data) {
        List<SseEmitter> list = emitters.get(matchId);
        if (list == null || list.isEmpty()) return;

        String json;
        try {
            json = mapper.writeValueAsString(data);
        } catch (Exception e) {
            return;
        }

        List<SseEmitter> dead = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name("score-update").data((Object) json));
            } catch (IOException ex) {
                dead.add(emitter);
            }
        }
        list.removeAll(dead);
    }

    private void remove(Long matchId, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(matchId);
        if (list != null) list.remove(emitter);
    }
}
