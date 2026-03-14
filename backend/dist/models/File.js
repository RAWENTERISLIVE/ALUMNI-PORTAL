"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../config/prisma"));
class FileModel {
    constructor(data) {
        this.filename = data.filename;
        this.originalName = data.originalName;
        this.mimetype = data.mimetype;
        this.size = data.size;
        this.path = data.path;
        this.url = data.url;
        this.uploadedBy = data.uploadedBy;
    }
    async save() {
        const created = await prisma_1.default.file.create({
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
exports.default = FileModel;
//# sourceMappingURL=File.js.map