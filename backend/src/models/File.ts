import prisma from '../config/prisma';

type FileInput = {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  uploadedBy: string;
};

class FileModel {
  _id?: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  uploadedBy: string;

  constructor(data: FileInput) {
    this.filename = data.filename;
    this.originalName = data.originalName;
    this.mimetype = data.mimetype;
    this.size = data.size;
    this.path = data.path;
    this.url = data.url;
    this.uploadedBy = data.uploadedBy;
  }

  async save() {
    const created = await prisma.file.create({
      data: {
        filename: this.filename,
        originalName: this.originalName,
        mimetype: this.mimetype,
        size: this.size,
        path: this.path,
        url: this.url,
        uploadedById: this.uploadedBy
      }
    });

    this._id = created.id;
    return this;
  }
}

export default FileModel;
