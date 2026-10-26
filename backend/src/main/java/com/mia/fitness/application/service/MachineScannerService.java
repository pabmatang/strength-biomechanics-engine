package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.ScannedMachineDto;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.chat.messages.Media;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

import java.util.List;

@Service
public class MachineScannerService {

    private final ChatClient.Builder chatClientBuilder;

    public MachineScannerService(ChatClient.Builder chatClientBuilder) {
        this.chatClientBuilder = chatClientBuilder;
    }

    /**
     * Scans a gym machine image with Multimodal AI (Llama 3.2-Vision)
     * and maps it to a strict JSON Schema DTO.
     */
    public ScannedMachineDto scanMachineImage(byte[] imageBytes, String mimeType) {
        BeanOutputConverter<ScannedMachineDto> outputConverter = new BeanOutputConverter<>(ScannedMachineDto.class);

        String userPrompt = """
            Eres un biomecánico experto en maquinaria de gimnasio de alta gama (Technogym Selection/Pure Strength,
            Hammer Strength Iso-Lateral, Matrix, Panatta, Eleiko).
            Examina la fotografía de la máquina de entrenamiento adjunta.
            Identifica con exactitud el modelo, fabricante, grupo muscular objetivo principal, secundarios
            y proporciona 3 tips biomecánicos fundamentales para regular el asiento, respaldo o levas de inicio.

            Formatea la respuesta EXCLUSIVAMENTE respetando el siguiente JSON Schema:
            %s
            """.formatted(outputConverter.getFormat());

        Media imageMedia = new Media(
                MimeTypeUtils.parseMimeType(mimeType != null ? mimeType : "image/jpeg"),
                new ByteArrayResource(imageBytes)
        );

        UserMessage userMessage = new UserMessage(userPrompt, List.of(imageMedia));

        ChatClient chatClient = chatClientBuilder.build();
        String responseContent = chatClient.prompt(new Prompt(userMessage))
                .call()
                .content();

        return outputConverter.convert(responseContent);
    }
}
