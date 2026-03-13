import io
import logging

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.colormasks import SolidFillColorMask

logger = logging.getLogger(__name__)


def generate_qr_code(url: str) -> bytes:
    """
    Generate a QR code PNG image as bytes for the given URL.

    Args:
        url: The URL to encode in the QR code.

    Returns:
        PNG image bytes.
    """
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        img = qr.make_image(
            image_factory=StyledPilImage,
            color_mask=SolidFillColorMask(
                back_color=(255, 255, 255),
                front_color=(33, 37, 41),
            ),
        )

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        logger.info(f"QR code generated for URL: {url}")
        return buffer.getvalue()

    except Exception as e:
        logger.error(f"Failed to generate QR code: {e}")
        # Fallback: generate simple QR without styling
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer.getvalue()
