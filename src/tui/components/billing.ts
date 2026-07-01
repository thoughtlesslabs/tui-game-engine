import { BoxRenderable, TextRenderable, StyledText, t, cyan, bold, type RenderContext } from "@opentui/core";
import QRCode from "qrcode";

export class TuiBillingWizard {
  private ctx: RenderContext;
  private checkStatus: () => Promise<boolean>;
  private onSuccess: () => void;
  private checkInterval: any;

  // Renderables
  public box: BoxRenderable;
  private textElement: TextRenderable;

  constructor(
    ctx: RenderContext,
    cols: number,
    rows: number,
    options: {
      checkoutUrl: string;
      title?: string;
      checkStatus: () => Promise<boolean>;
    },
    onSuccess: () => void
  ) {
    this.ctx = ctx;
    this.checkStatus = options.checkStatus;
    this.onSuccess = onSuccess;

    const width = 56;
    const height = 21; // Exactly fits 19 content lines + 2 borders

    this.box = new BoxRenderable(ctx, {
      width,
      height,
      border: true,
      borderColor: "#FF007F", // Neon Magenta
      title: options.title || " Secure Terminal Shop Checkout ",
      titleAlignment: "center",
      marginTop: Math.max(1, Math.floor((rows - height) / 2)),
      marginLeft: Math.max(1, Math.floor((cols - width) / 2))
    });

    this.textElement = new TextRenderable(ctx, {
      width: "100%",
      height: "100%",
      paddingLeft: 0,
      paddingTop: 0 // No padding top to save vertical space
    });
    this.box.add(this.textElement);

    this.renderCheckout(options.checkoutUrl);
    this.startPolling();
  }

  private async renderCheckout(url: string) {
    try {
      const qr = QRCode.create(url);
      const size = qr.modules.size;
      
      const qrLines: string[] = [];
      for (let y = 0; y < size; y += 2) {
        let line = "██"; // 2-module left quiet zone
        for (let x = 0; x < size; x++) {
          const top = qr.modules.get(x, y);
          const bottom = y + 1 < size ? qr.modules.get(x, y + 1) : 0;
          
          if (top && bottom) {
            line += " ";
          } else if (top && !bottom) {
            line += "▄";
          } else if (!top && bottom) {
            line += "▀";
          } else {
            line += "█";
          }
        }
        line += "██"; // 2-module right quiet zone
        qrLines.push(line);
      }

      // Center the lines inside the 54-character inner width (56 - 2 borders)
      const innerWidth = 54;
      const qrWidth = size + 4; // size + 4 modules
      const leftPad = Math.max(0, Math.floor((innerWidth - qrWidth) / 2));
      const padStr = " ".repeat(leftPad);
      
      const paddedQrText = qrLines.map(line => padStr + line).join("\n");
      const urlText = cyan(url);

      this.textElement.content = t`  Scan QR Code to pay securely via Stripe:
${paddedQrText}
  Link: ${urlText}
  Status: Awaiting payment... [ESC to cancel]`;
      this.ctx.requestRender();
    } catch (e: any) {
      this.textElement.content = `  Error generating QR code: ${e.message}\n\n  Please click link: ${url}`;
      this.ctx.requestRender();
    }
  }

  private startPolling() {
    this.checkInterval = setInterval(async () => {
      try {
        const isPaid = await this.checkStatus();
        if (isPaid) {
          this.destroy();
          this.onSuccess();
        }
      } catch (e) {
        console.error("[BillingWizard] Error checking status:", e);
      }
    }, 2500);
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}
