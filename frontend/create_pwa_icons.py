
from pathlib import Path
from PIL import Image

# Nexora frontend public folder
PUBLIC_DIR = Path(__file__).parent / "public"

# Original brand assets
LOGO_PATH = PUBLIC_DIR / "nexora-mark-transparent.png"
WORDMARK_PATH = PUBLIC_DIR / "nexora-wordmark-transparent.png"

# Check that both original images exist
for file_path in (LOGO_PATH, WORDMARK_PATH):
    if not file_path.exists():
        raise FileNotFoundError(
            f"Original Nexora image not found: {file_path}"
        )

# Open the original N logo.
# The source file is never overwritten.
original_logo = Image.open(LOGO_PATH).convert("RGBA")

# Generate square app icons.
for size in (192, 512):
    canvas = Image.new(
        "RGBA",
        (size, size),
        (0, 0, 0, 0)
    )

    # Preserve the original proportions.
    max_dimension = int(size * 0.72)

    scale = min(
        max_dimension / original_logo.width,
        max_dimension / original_logo.height
    )

    new_width = round(original_logo.width * scale)
    new_height = round(original_logo.height * scale)

    resized_logo = original_logo.resize(
        (new_width, new_height),
        Image.Resampling.LANCZOS
    )

    # Center the logo without cropping it.
    x = (size - new_width) // 2
    y = (size - new_height) // 2

    canvas.alpha_composite(resized_logo, (x, y))

    output_path = PUBLIC_DIR / f"nexora-icon-{size}.png"

    canvas.save(
        output_path,
        format="PNG",
        optimize=True
    )

    print(f"Created: {output_path}")

print("\nNEXORA PWA icons created successfully.")
print("Original logo and wordmark remain untouched.")
