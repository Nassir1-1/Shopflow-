package com.shopflow.backend.service;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.ConvolveOp;
import java.awt.image.Kernel;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;

/**
 * FILE LOCATION:
 *   src/main/java/com/shopflow/backend/service/ImageProtectionService.java
 *
 * PURPOSE:
 *   Takes an uploaded image's raw bytes and returns TWO versions:
 *     1. watermarkedPreview  — blurred + watermark text (stored publicly, used in gallery)
 *     2. originalBytes       — stored privately (served only after payment)
 *
 * DEPENDENCIES (already in Spring Boot starter):
 *   - java.awt (built-in to JDK — no extra Maven dependency needed)
 *
 * HOW TO CALL IT (from your product upload endpoint):
 *   @Autowired ImageProtectionService imgService;
 *
 *   byte[] preview = imgService.createWatermarkedPreview(uploadedFileBytes, "shopflow.tn");
 *   // store preview at /public/previews/{productId}.jpg
 *   // store originalBytes at /private/originals/{productId}.jpg
 */
@Service
public class ImageProtectionService {

    /**
     * Creates a blurred + watermarked version safe to show publicly.
     *
     * @param originalBytes raw bytes of the uploaded image (JPG or PNG)
     * @param watermarkText text to stamp on the image, e.g. "© ShopFlow.tn"
     * @return byte array of the protected JPEG preview
     */
    public byte[] createWatermarkedPreview(byte[] originalBytes, String watermarkText)
            throws IOException {

        // 1. Decode original
        BufferedImage original = ImageIO.read(new ByteArrayInputStream(originalBytes));
        if (original == null) throw new IOException("Cannot decode image.");

        int w = original.getWidth();
        int h = original.getHeight();

        // 2. Apply heavy blur (box blur, radius 12)
        BufferedImage blurred = applyBoxBlur(original, 12);

        // 3. Draw watermark text diagonally across the blurred image
        Graphics2D g = blurred.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Semi-transparent white text
        g.setColor(new Color(255, 255, 255, 120));
        g.setFont(new Font("Arial", Font.BOLD, Math.max(24, w / 12)));

        // Rotate 45° around centre and repeat the watermark
        g.rotate(Math.toRadians(-45), w / 2.0, h / 2.0);
        FontMetrics fm = g.getFontMetrics();
        int textW = fm.stringWidth(watermarkText);
        int textH = fm.getHeight();

        for (int y = -h; y < h * 2; y += textH * 5) {
            for (int x = -w; x < w * 2; x += textW + 60) {
                g.drawString(watermarkText, x, y);
            }
        }
        g.dispose();

        // 4. Encode to JPEG bytes
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(blurred, "jpg", out);
        return out.toByteArray();
    }

    /** Box blur using ConvolveOp — radius controls intensity. */
    private BufferedImage applyBoxBlur(BufferedImage src, int radius) {
        int size   = radius * 2 + 1;
        float val  = 1.0f / (size * size);
        float[] matrix = new float[size * size];
        Arrays.fill(matrix, val);

        // Convert to INT_RGB to avoid alpha channel issues with ConvolveOp
        BufferedImage rgb = new BufferedImage(src.getWidth(), src.getHeight(),
                BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.drawImage(src, 0, 0, null);
        g.dispose();

        // Apply blur multiple times for a stronger effect
        BufferedImage result = rgb;
        for (int pass = 0; pass < 4; pass++) {
            result = new ConvolveOp(new Kernel(size, size, matrix),
                    ConvolveOp.EDGE_NO_OP, null).filter(result, null);
        }
        return result;
    }
}