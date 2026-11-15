"""Regenerates the app icons into assets/images (usage: python3 tools/make-icons.py assets/images). Needs Pillow."""
from PIL import Image, ImageDraw, ImageFilter
import sys

OUT = sys.argv[1]
BG = (18, 20, 22, 255)        # theme background #121416
LIME = (197, 242, 106, 255)   # theme primary #c5f26a
DARK = (20, 31, 0, 255)       # theme onPrimary #141f00
SS = 4                        # supersampling factor
N = 1024 * SS


def dumbbell(size, color, angle=-45):
    """A dumbbell glyph centred in a transparent square, rotated."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    c = size / 2
    u = size / 1024  # unit

    def rr(x0, y0, x1, y1, r):
        d.rounded_rectangle([c + x0 * u, c + y0 * u, c + x1 * u, c + y1 * u], radius=r * u, fill=color)

    rr(-170, -26, 170, 26, 12)             # bar
    for sign in (-1, 1):
        a, b = sorted((sign * 150, sign * 205))
        rr(a, -150, b, 150, 24)            # inner plate
        a, b = sorted((sign * 215, sign * 255))
        rr(a, -102, b, 102, 20)            # outer plate
    return layer.rotate(angle, resample=Image.BICUBIC, center=(c, c))


def sphere(size, radius_frac, glow=True):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    c = size / 2
    r = size * radius_frac
    if glow:
        halo = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ImageDraw.Draw(halo).ellipse([c - r * 1.12, c - r * 1.12, c + r * 1.12, c + r * 1.12], fill=(197, 242, 106, 90))
        layer.alpha_composite(halo.filter(ImageFilter.GaussianBlur(size * 0.035)))
    ImageDraw.Draw(layer).ellipse([c - r, c - r, c + r, c + r], fill=LIME)
    return layer


def logo(size, radius_frac, glyph_scale):
    img = sphere(size, radius_frac)
    g = dumbbell(size, DARK)
    k = glyph_scale
    g = g.resize((int(size * k), int(size * k)), Image.LANCZOS)
    img.alpha_composite(g, ((size - g.width) // 2, (size - g.height) // 2))
    return img


def save(img, name, px=1024):
    img.resize((px, px), Image.LANCZOS).save(f"{OUT}/{name}", optimize=True)


# App icon: full-bleed dark background (iOS rounds the corners itself, and forbids transparency).
icon = Image.new("RGBA", (N, N), BG)
icon.alpha_composite(logo(N, 0.30, 0.78))
save(icon.convert("RGB").convert("RGBA"), "icon.png")

# Splash: the mark alone on transparent; the splash background colour comes from app.config.ts.
save(logo(N, 0.30, 0.78), "splash-icon.png")

# Android adaptive icon: keep the mark inside the central 66% safe zone.
save(logo(N, 0.24, 0.62), "android-icon-foreground.png")
save(Image.new("RGBA", (N, N), BG), "android-icon-background.png")

# Monochrome (themed icons): a single-colour silhouette. The dumbbell is cut out of a filled sphere.
mono = Image.new("RGBA", (N, N), (0, 0, 0, 0))
ImageDraw.Draw(mono).ellipse([N / 2 - N * 0.24, N / 2 - N * 0.24, N / 2 + N * 0.24, N / 2 + N * 0.24], fill=(255, 255, 255, 255))
cut = dumbbell(N, (0, 0, 0, 255))
cut = cut.resize((int(N * 0.62), int(N * 0.62)), Image.LANCZOS)
hole = Image.new("L", (N, N), 0)
hole.paste(cut.split()[3], ((N - cut.width) // 2, (N - cut.height) // 2))
alpha = mono.split()[3]
alpha = Image.composite(Image.new("L", (N, N), 0), alpha, hole)
mono.putalpha(alpha)
save(mono, "android-icon-monochrome.png")

# Web favicon.
fav = Image.new("RGBA", (N, N), BG)
fav.alpha_composite(logo(N, 0.40, 1.0))
save(fav, "favicon.png", px=48)
print("ok")
