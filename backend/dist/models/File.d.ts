type FileInput = {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    url: string;
    uploadedBy: string;
};
declare class FileModel {
    _id?: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    url: string;
    uploadedBy: string;
    constructor(data: FileInput);
    save(): Promise<this>;
}
export default FileModel;
//# sourceMappingURL=File.d.ts.map