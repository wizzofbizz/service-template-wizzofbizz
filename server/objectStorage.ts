import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { Response } from "express";

/**
 * File storage for uploaded images.
 *
 * This previously authenticated through the Replit sidecar at 127.0.0.1:1106
 * and could not run anywhere else. It now writes to the local filesystem, so
 * the template works on any host — Docker, Coolify, a VPS.
 *
 * UPLOAD_DIR should point at a mounted volume in production so uploads
 * survive container restarts and redeploys.
 */

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), "uploads");

/** Image types we accept. Anything else is rejected before it touches disk. */
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

export class ObjectNotFoundError extends Error {
  constructor(message = "Object not found") {
    super(message);
    this.name = "ObjectNotFoundError";
  }
}

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Resolves a public object path to a file on disk, refusing anything that
 * escapes the upload directory. Without this check a crafted path such as
 * /objects/../../etc/passwd would read arbitrary files.
 */
function resolveSafePath(objectPath: string): string {
  const relative = objectPath.replace(/^\/objects\//, "").replace(/^\/+/, "");
  const resolved = path.resolve(UPLOAD_DIR, relative);

  if (resolved !== UPLOAD_DIR && !resolved.startsWith(UPLOAD_DIR + path.sep)) {
    throw new ObjectNotFoundError();
  }
  return resolved;
}

export class ObjectStorageService {
  /**
   * Returns the endpoint the browser should upload to.
   *
   * The Replit implementation returned a pre-signed cloud URL. Here uploads
   * come back through our own API, so the shape is kept but the URL is local.
   */
  async getObjectEntityUploadURL(): Promise<string> {
    ensureUploadDir();
    return "/api/uploads";
  }

  /** Stores an uploaded buffer and returns its public path. */
  async storeUpload(buffer: Buffer, originalName: string): Promise<string> {
    ensureUploadDir();

    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(
        `Unsupported file type "${ext}". Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}`
      );
    }

    const filename = `${crypto.randomUUID()}${ext}`;
    await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return `/objects/${filename}`;
  }

  /**
   * Stores a file under a logical prefix (e.g. "quotes/<id>") and returns its
   * public path. Used for customer-supplied photos attached to quotes.
   */
  async uploadPublicFile(
    prefix: string,
    fileName: string,
    buffer: Buffer,
    _mimeType?: string
  ): Promise<string> {
    // Flatten the prefix into the filename rather than creating nested
    // directories, so path traversal via prefix is impossible.
    const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "-");
    const ext = path.extname(fileName).toLowerCase() || ".jpg";

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(`Unsupported file type "${ext}".`);
    }

    ensureUploadDir();
    const stored = `${safePrefix}-${crypto.randomUUID()}${ext}`;
    await fs.promises.writeFile(path.join(UPLOAD_DIR, stored), buffer);

    return `/objects/${stored}`;
  }

  /**
   * Normalises whatever the client reports back into a public object path.
   * Accepts a full URL or an already-normalised path.
   */
  normalizeObjectEntityPath(rawUrl: string): string {
    if (!rawUrl) return rawUrl;

    try {
      const url = new URL(rawUrl);
      return url.pathname.startsWith("/objects/")
        ? url.pathname
        : `/objects/${path.basename(url.pathname)}`;
    } catch {
      return rawUrl.startsWith("/objects/") ? rawUrl : `/objects/${path.basename(rawUrl)}`;
    }
  }

  /** Resolves a public path to a file on disk. */
  async getObjectEntityFile(objectPath: string): Promise<string> {
    const filePath = resolveSafePath(objectPath);

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      throw new ObjectNotFoundError();
    }
    return filePath;
  }

  /** Streams a stored file to the client. */
  async downloadObject(filePath: string, res: Response, cacheSeconds = 3600): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();
    const stat = await fs.promises.stat(filePath);

    res.setHeader("Content-Type", CONTENT_TYPES[ext] || "application/octet-stream");
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Cache-Control", `public, max-age=${cacheSeconds}`);

    fs.createReadStream(filePath).pipe(res);
  }

  /** Deletes a stored object. Missing files are not an error. */
  async deleteObject(objectPath: string): Promise<void> {
    try {
      await fs.promises.unlink(resolveSafePath(objectPath));
    } catch (error: any) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}
