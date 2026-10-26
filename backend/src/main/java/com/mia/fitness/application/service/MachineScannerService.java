package com.mia.fitness.application.service;

import com.mia.fitness.application.dto.ScannedMachineDto;
import com.mia.fitness.infrastructure.web.error.AiUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Media;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

import java.util.List;
import java.util.Locale;

@Service
public class MachineScannerService {

    private static final Logger log = LoggerFactory.getLogger(MachineScannerService.class);

    private final ChatClient.Builder chatClientBuilder;

    public MachineScannerService(ChatClient.Builder chatClientBuilder) {
        this.chatClientBuilder = chatClientBuilder;
    }

    /**
     * Classifies a gym machine from a photo using multimodal structured output and
     * returns a typed DTO. The model is instructed not to invent a brand or model it
     * cannot see.
     */
    public ScannedMachineDto scanMachineImage(byte[] imageBytes, String mimeType) {
        BeanOutputConverter<ScannedMachineDto> outputConverter =
                new BeanOutputConverter<>(ScannedMachineDto.class);

        String userPrompt = """
                Eres un biomecánico experto en maquinaria de gimnasio (Technogym Selection/Pure Strength,
                Hammer Strength Iso-Lateral, Matrix, Panatta, Eleiko).
                Examina la fotografía adjunta de la máquina.

                Reglas:
                - Si no puedes identificar la marca o el modelo con certeza, indícalo en el campo
                  correspondiente en lugar de inventarlo.
                - Describe el plano de movimiento y el perfil de resistencia que se deduce de la foto.
                - Aporta exactamente 3 consejos de ajuste (asiento, respaldo o levas) accionables.

                Formatea la respuesta EXCLUSIVAMENTE respetando este JSON Schema:
                %s
                """.formatted(outputConverter.getFormat());

        Media imageMedia = new Media(
                MimeTypeUtils.parseMimeType(mimeType != null ? mimeType : "image/jpeg"),
                new ByteArrayResource(imageBytes)
        );

        UserMessage userMessage = new UserMessage(userPrompt, List.of(imageMedia));
        ChatClient chatClient = chatClientBuilder.build();

        String responseContent;
        try {
            responseContent = chatClient.prompt(new Prompt(userMessage)).call().content();
        } catch (RuntimeException ex) {
            log.warn("Ollama vision call failed: {}", ex.getMessage());
            throw new AiUnavailableException(
                    "El modelo de visión no está disponible. Comprueba que Ollama esté arrancado y " +
                            "que el modelo llama3.2-vision esté descargado.",
                    ex
            );
        }

        if (responseContent == null || responseContent.isBlank()) {
            throw new AiUnavailableException("El modelo de visión devolvió una respuesta vacía", null);
        }

        try {
            return outputConverter.convert(responseContent);
        } catch (RuntimeException ex) {
            log.warn("Structured output could not be parsed: {}", responseContent);
            throw new AiUnavailableException(String.format(Locale.ROOT,
                    "El modelo no devolvió un JSON válido para el esquema esperado: %s", ex.getMessage()), ex);
        }
    }
}
