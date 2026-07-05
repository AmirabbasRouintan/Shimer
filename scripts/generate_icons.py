#!/usr/bin/env python3
"""Generate beautiful sparkle/shimmer icons for the Shimer app."""

from PIL import Image, ImageDraw, ImageFilter, ImageChops
import math
import os

OUT_DIR = "assets/images"
AMBER = (245, 158, 11)     # #F59E0B
DARK = (10, 10, 15)        # almost black
GOLD1 = (255, 200, 50)     # bright gold
GOLD2 = (245, 158, 11)     # amber
GOLD3 = (180, 100, 20)     # darker gold
WHITE = (255, 255, 255)

def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def draw_sparkle_star(draw, cx, cy, size, color, rotation=0, alpha=255):
    """Draw a 4-pointed sparkle star."""
    points = []
    for i in range(8):
        angle = math.pi * i / 4 + rotation
        r = size if i % 2 == 0 else size * 0.3
        points.append((cx + math.cos(angle) * r, cy + math.sin(angle) * r))
    draw.polygon(points, fill=(*color, alpha))

def radial_gradient(size, colors):
    """Create a radial gradient image."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    center = size // 2
    max_r = size * 0.5
    for r in range(int(max_r), 0, -1):
        frac = r / max_r
        # interpolate between colors
        idx = frac * (len(colors) - 1)
        i0 = int(idx)
        i1 = min(i0 + 1, len(colors) - 1)
        t = idx - i0
        c0 = colors[i0]
        c1 = colors[i1]
        cr = int(c0[0] + (c1[0] - c0[0]) * t)
        cg = int(c0[1] + (c1[1] - c0[1]) * t)
        cb = int(c0[2] + (c1[2] - c0[2]) * t)
        ca = int(c0[3] if len(c0) > 3 else 255 + (c1[3] - c0[3]) * t if len(c1) > 3 else 0)
        draw.ellipse(
            [center - r, center - r, center + r, center + r],
            fill=(cr, cg, cb, ca)
        )
    return img

def make_icon(size):
    """Generate the main app icon at given size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx = cy = size // 2
    s = size
    
    # === Background: Deep dark with subtle gradient ===
    bg = Image.new("RGBA", (s, s), DARK + (255,))
    # Add a subtle radial glow from center
    for r in range(s // 2, 0, -1):
        frac = r / (s // 2)
        alpha = int(max(0, (1 - frac) * 30))
        if alpha < 1:
            continue
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(AMBER[0], AMBER[1], AMBER[2], alpha)
        )
    img = Image.alpha_composite(bg, img)
    draw = ImageDraw.Draw(img)
    
    # === Outer glow ring ===
    for r in range(int(s * 0.4), int(s * 0.22), -1):
        alpha = int(max(0, 20 * (1 - r / (s * 0.4))))
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            outline=(AMBER[0], AMBER[1], AMBER[2], alpha),
            width=1
        )
    
    # === Main diamond shape ===
    diamond_size = s * 0.3
    # Diamond facets
    diamond_points = [
        (cx, cy - diamond_size),                    # top
        (cx + diamond_size * 0.6, cy),               # right
        (cx, cy + diamond_size * 1.1),               # bottom (longer bottom point)
        (cx - diamond_size * 0.6, cy),               # left
    ]
    
    # Draw diamond with gradient fill - top half lighter
    # Top-left facet
    facet1 = [diamond_points[0], diamond_points[3], (cx, cy), diamond_points[0]]
    # Top-right facet
    facet2 = [diamond_points[0], (cx, cy), diamond_points[1], diamond_points[0]]
    # Bottom-left facet  
    facet3 = [diamond_points[3], diamond_points[2], (cx, cy), diamond_points[3]]
    # Bottom-right facet
    facet4 = [(cx, cy), diamond_points[2], diamond_points[1], (cx, cy)]
    
    # Top facets - brighter gold
    draw.polygon(facet1, fill=(255, 215, 80, 240))
    draw.polygon(facet2, fill=(255, 195, 50, 240))
    # Bottom facets - deeper amber
    draw.polygon(facet3, fill=(220, 140, 20, 240))
    draw.polygon(facet4, fill=(200, 120, 15, 240))
    
    # Diamond edge highlight (left edge catch light)
    highlight = [
        (cx - diamond_size * 0.5, cy - diamond_size * 0.15),
        (cx - diamond_size * 0.35, cy - diamond_size * 0.6),
        (cx - diamond_size * 0.2, cy - diamond_size * 0.3),
    ]
    draw.polygon(highlight, fill=(255, 240, 180, 180))
    
    # Diamond outline
    draw.polygon(diamond_points, outline=(255, 220, 100, 200), width=2)
    
    # === Sparkle stars around the diamond ===
    sparkle_positions = [
        (cx - s * 0.32, cy - s * 0.35, s * 0.06, 0, 220),
        (cx + s * 0.35, cy - s * 0.3, s * 0.05, math.pi / 4, 200),
        (cx + s * 0.3, cy + s * 0.38, s * 0.04, math.pi / 6, 180),
        (cx - s * 0.28, cy + s * 0.36, s * 0.045, math.pi / 3, 190),
        (cx, cy - s * 0.42, s * 0.03, 0, 160),
        (cx + s * 0.38, cy + s * 0.1, s * 0.025, math.pi / 5, 140),
        (cx - s * 0.36, cy + s * 0.12, s * 0.035, math.pi / 7, 150),
    ]
    
    for sx, sy, ssize, srot, salpha in sparkle_positions:
        draw_sparkle_star(draw, int(sx), int(sy), int(ssize), GOLD1, rotation=srot, alpha=salpha)
    
    # === Small dot sparkles (tiny glints) ===
    dot_positions = [
        (cx - s * 0.4, cy - s * 0.22, int(s * 0.008)),
        (cx + s * 0.42, cy + s * 0.22, int(s * 0.006)),
        (cx - s * 0.15, cy - s * 0.45, int(s * 0.009)),
        (cx + s * 0.15, cy + s * 0.45, int(s * 0.007)),
        (cx - s * 0.45, cy + s * 0.28, int(s * 0.005)),
    ]
    for dx, dy, dr in dot_positions:
        draw.ellipse(
            [dx - dr, dy - dr, dx + dr, dy + dr],
            fill=(255, 255, 220, 200)
        )
    
    # === Subtle bottom reflection line ===
    reflect_y = cy + diamond_size * 1.2
    for i in range(int(s * 0.15)):
        alpha = int(max(0, 80 * (1 - i / (s * 0.15))))
        w = int(s * 0.12 * (1 - i / (s * 0.3)))
        if w < 1:
            break
        draw.ellipse(
            [cx - w, reflect_y + i, cx + w, reflect_y + i + 1],
            fill=(AMBER[0], AMBER[1], AMBER[2], alpha)
        )
    
    return img

def make_android_foreground(size):
    """Android adaptive icon foreground - sparkle/shimmer symbol only."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx = cy = size // 2
    s = size
    
    # Main diamond - slightly smaller for safe zone
    diamond_size = s * 0.22
    diamond_points = [
        (cx, cy - diamond_size),
        (cx + diamond_size * 0.6, cy),
        (cx, cy + diamond_size * 1.1),
        (cx - diamond_size * 0.6, cy),
    ]
    
    # Diamond facets
    draw.polygon([diamond_points[0], diamond_points[3], (cx, cy)], fill=(255, 215, 80, 240))
    draw.polygon([diamond_points[0], (cx, cy), diamond_points[1]], fill=(255, 195, 50, 240))
    draw.polygon([diamond_points[3], diamond_points[2], (cx, cy)], fill=(220, 140, 20, 240))
    draw.polygon([(cx, cy), diamond_points[2], diamond_points[1]], fill=(200, 120, 15, 240))
    
    # Highlight
    highlight = [
        (cx - diamond_size * 0.5, cy - diamond_size * 0.15),
        (cx - diamond_size * 0.35, cy - diamond_size * 0.6),
        (cx - diamond_size * 0.2, cy - diamond_size * 0.3),
    ]
    draw.polygon(highlight, fill=(255, 240, 180, 180))
    draw.polygon(diamond_points, outline=(255, 220, 100, 200), width=2)
    
    # Sparkle stars
    sparkles = [
        (cx - s * 0.32, cy - s * 0.35, s * 0.055, 0),
        (cx + s * 0.35, cy - s * 0.3, s * 0.045, math.pi / 4),
        (cx + s * 0.3, cy + s * 0.38, s * 0.04, math.pi / 6),
        (cx - s * 0.28, cy + s * 0.36, s * 0.04, math.pi / 3),
        (cx, cy - s * 0.42, s * 0.03, 0),
    ]
    for sx, sy, ssize, srot in sparkles:
        draw_sparkle_star(draw, int(sx), int(sy), int(ssize), WHITE, rotation=srot, alpha=200)
    
    return img

def make_android_background(size):
    """Android adaptive icon background - dark with subtle radial amber glow."""
    img = Image.new("RGBA", (size, size), DARK + (255,))
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2
    # Subtle glow
    for r in range(size // 2, 0, -1):
        frac = r / (size // 2)
        alpha = int(max(0, (1 - frac) * 20))
        if alpha < 1:
            continue
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(AMBER[0], AMBER[1], AMBER[2], alpha))
    return img

def make_monochrome(size):
    """Android monochrome icon - white diamond on transparent."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx = cy = size // 2
    s = size
    diamond_size = s * 0.22
    
    diamond_points = [
        (cx, cy - diamond_size),
        (cx + diamond_size * 0.6, cy),
        (cx, cy + diamond_size * 1.1),
        (cx - diamond_size * 0.6, cy),
    ]
    
    # Monochrome facets - different opacities of white
    draw.polygon([diamond_points[0], diamond_points[3], (cx, cy)], fill=(255, 255, 255, 200))
    draw.polygon([diamond_points[0], (cx, cy), diamond_points[1]], fill=(255, 255, 255, 180))
    draw.polygon([diamond_points[3], diamond_points[2], (cx, cy)], fill=(200, 200, 200, 160))
    draw.polygon([(cx, cy), diamond_points[2], diamond_points[1]], fill=(180, 180, 180, 140))
    draw.polygon(diamond_points, outline=(255, 255, 255, 220), width=2)
    
    # Small sparkles
    sparkles = [
        (cx - s * 0.32, cy - s * 0.35, s * 0.05, 0),
        (cx + s * 0.35, cy - s * 0.3, s * 0.04, math.pi / 4),
        (cx + s * 0.3, cy + s * 0.38, s * 0.035, math.pi / 6),
        (cx - s * 0.28, cy + s * 0.36, s * 0.035, math.pi / 3),
    ]
    for sx, sy, ssize, srot in sparkles:
        draw_sparkle_star(draw, int(sx), int(sy), int(ssize), WHITE, rotation=srot, alpha=150)
    
    return img

def make_favicon(size):
    """Small favicon - simplified sparkle diamond."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx = cy = size // 2
    s = size
    diamond_size = s * 0.28
    
    diamond_points = [
        (cx, cy - diamond_size),
        (cx + diamond_size * 0.6, cy),
        (cx, cy + diamond_size * 1.1),
        (cx - diamond_size * 0.6, cy),
    ]
    
    draw.polygon([diamond_points[0], diamond_points[3], (cx, cy)], fill=(255, 215, 80, 240))
    draw.polygon([diamond_points[0], (cx, cy), diamond_points[1]], fill=(255, 195, 50, 240))
    draw.polygon([diamond_points[3], diamond_points[2], (cx, cy)], fill=(220, 140, 20, 240))
    draw.polygon([(cx, cy), diamond_points[2], diamond_points[1]], fill=(200, 120, 15, 240))
    draw.polygon(diamond_points, outline=(255, 220, 100, 200), width=1)
    
    return img

def make_splash(size):
    """Splash screen icon - centered sparkle with dark bg."""
    img = Image.new("RGBA", (size, size), DARK + (255,))
    draw = ImageDraw.Draw(img)
    
    cx = cy = size // 2
    s = size
    
    # Bigger radial glow
    for r in range(s // 2, 0, -1):
        frac = r / (s // 2)
        alpha = int(max(0, (1 - frac) * 35))
        if alpha < 1:
            continue
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(AMBER[0], AMBER[1], AMBER[2], alpha))
    
    # Larger diamond for splash
    diamond_size = s * 0.15
    diamond_points = [
        (cx, cy - diamond_size),
        (cx + diamond_size * 0.6, cy),
        (cx, cy + diamond_size * 1.1),
        (cx - diamond_size * 0.6, cy),
    ]
    
    draw.polygon([diamond_points[0], diamond_points[3], (cx, cy)], fill=(255, 215, 80, 240))
    draw.polygon([diamond_points[0], (cx, cy), diamond_points[1]], fill=(255, 195, 50, 240))
    draw.polygon([diamond_points[3], diamond_points[2], (cx, cy)], fill=(220, 140, 20, 240))
    draw.polygon([(cx, cy), diamond_points[2], diamond_points[1]], fill=(200, 120, 15, 240))
    draw.polygon(diamond_points, outline=(255, 220, 100, 200), width=2)
    
    return img


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    
    # Generate all icons
    print("Generating icon.png (1024x1024)...")
    icon = make_icon(1024)
    icon.save(os.path.join(OUT_DIR, "icon.png"), "PNG")
    
    print("Generating android-icon-foreground.png (512x512)...")
    fg = make_android_foreground(512)
    fg.save(os.path.join(OUT_DIR, "android-icon-foreground.png"), "PNG")
    
    print("Generating android-icon-background.png (512x512)...")
    bg = make_android_background(512)
    bg.save(os.path.join(OUT_DIR, "android-icon-background.png"), "PNG")
    
    print("Generating android-icon-monochrome.png (432x432)...")
    mc = make_monochrome(432)
    mc.save(os.path.join(OUT_DIR, "android-icon-monochrome.png"), "PNG")
    
    print("Generating favicon.png (48x48)...")
    fv = make_favicon(48)
    fv.save(os.path.join(OUT_DIR, "favicon.png"), "PNG")
    
    print("Generating splash-icon.png (1024x1024)...")
    splash = make_splash(1024)
    splash.save(os.path.join(OUT_DIR, "splash-icon.png"), "PNG")
    
    # Also update splash screen config in app.json to use dark bg
    print("\n✅ All icons generated successfully!")
    print("Icons created:")
    for f in ["icon.png", "android-icon-foreground.png", "android-icon-background.png", 
              "android-icon-monochrome.png", "favicon.png", "splash-icon.png"]:
        path = os.path.join(OUT_DIR, f)
        size = os.path.getsize(path)
        print(f"  📁 {f} ({size/1024:.1f} KB)")


if __name__ == "__main__":
    main()
