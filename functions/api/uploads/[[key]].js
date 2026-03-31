const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });

const getObjectKey = (value) => {
  if (Array.isArray(value)) {
    return value.join("/");
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
};

const encodeObjectKey = (objectKey) =>
  objectKey
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const sanitizeFilename = (name) =>
  (name || "upload.bin")
    .replaceAll(/[^a-zA-Z0-9._-]/g, "_")
    .replaceAll(/_+/g, "_")
    .slice(-120);

const buildObjectKey = (name) => {
  const day = new Date().toISOString().slice(0, 10);
  return `uploads/${day}/${crypto.randomUUID()}-${sanitizeFilename(name)}`;
};

const createUpload = async (context) => {
  const form = await context.request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return json(
      {
        success: false,
        message: "Expected multipart/form-data with a file field named 'file'"
      },
      400
    );
  }

  const objectKey = buildObjectKey(file.name);
  const uploadId = crypto.randomUUID();
  const uploadedBy = context.request.headers.get("x-user-id") || "anonymous";
  const body = await file.arrayBuffer();

  await context.env.UPLOADS_BUCKET.put(objectKey, body, {
    httpMetadata: {
      contentType: file.type || "application/octet-stream"
    },
    customMetadata: {
      originalName: file.name,
      uploadedBy
    }
  });

  await context.env.DB.prepare(
    "INSERT INTO uploads (id, object_key, original_name, content_type, size_bytes, uploaded_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
  )
    .bind(
      uploadId,
      objectKey,
      file.name,
      file.type || "application/octet-stream",
      file.size,
      uploadedBy
    )
    .run();

  return json({
    success: true,
    message: "File uploaded to R2",
    data: {
      id: uploadId,
      key: objectKey,
      url: `/api/uploads/${encodeObjectKey(objectKey)}`,
      originalName: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream"
    }
  });
};

const readUpload = async (context) => {
  const objectKey = getObjectKey(context.params.key);

  if (!objectKey) {
    return json(
      {
        success: false,
        message: "Missing upload object key"
      },
      400
    );
  }

  const object = await context.env.UPLOADS_BUCKET.get(objectKey);

  if (!object) {
    return json(
      {
        success: false,
        message: "File not found"
      },
      404
    );
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/octet-stream");
  }

  return new Response(object.body, {
    status: 200,
    headers
  });
};

const deleteUpload = async (context) => {
  const objectKey = getObjectKey(context.params.key);

  if (!objectKey) {
    return json(
      {
        success: false,
        message: "Missing upload object key"
      },
      400
    );
  }

  await context.env.UPLOADS_BUCKET.delete(objectKey);
  await context.env.DB.prepare("DELETE FROM uploads WHERE object_key = ?1")
    .bind(objectKey)
    .run();

  return json({
    success: true,
    message: "File deleted",
    data: {
      key: objectKey
    }
  });
};

export async function onRequest(context) {
  switch (context.request.method) {
    case "GET":
      return readUpload(context);
    case "POST":
      return createUpload(context);
    case "DELETE":
      return deleteUpload(context);
    default:
      return json(
        {
          success: false,
          message: "Method not allowed"
        },
        405
      );
  }
}
