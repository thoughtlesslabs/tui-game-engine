import { BoxRenderable, TextRenderable, type RenderContext } from "@opentui/core";
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

    const width = 62;
    const height = 18;

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
      paddingLeft: 2,
      paddingTop: 1
    });
    this.box.add(this.textElement);

    this.renderCheckout(options.checkoutUrl);
    this.startPolling();
  }

  private async renderCheckout(url: string) {
    try {
      // Generate compact terminal ASCII QR code
      const qrAscii = await QRCode.toString(url, {
        type: "terminal",
        small: true
      });

      // Split the QR code lines to pad them visually
      const qrLines = qrAscii.split("\n").map(line => "   " + line).join("\n");

      this.textElement.content = `Scan QR Code to pay securely via Stripe:\n\n${qrLines}\n\nLink: \x1b[36m${url}\x1b[0m\n\nAwaiting payment verification... [ESC to cancel]`;
      this.ctx.requestRender();
    } catch (e: any) {
      this.textElement.content = `Error generating QR code: ${e.message}\n\nPlease click link: ${url}`;
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
