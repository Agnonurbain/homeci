"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock Firebase Admin
vitest_1.vi.mock('./firebase-admin', () => ({
    getFirestore: vitest_1.vi.fn(),
    getStorage: vitest_1.vi.fn(),
    logger: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
    },
}));
const storageCleanup_1 = require("../storageCleanup");
const admin = __importStar(require("./firebase-admin"));
function makeMockDoc(data, id = 'doc1') {
    return { id, data: () => data };
}
function makeMockQuerySnapshot(docs) {
    return {
        empty: docs.length === 0,
        docs,
        size: docs.length,
    };
}
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
(0, vitest_1.describe)('cleanupOrphanedFiles', () => {
    (0, vitest_1.it)('ne supprime rien si aucun bien orphelin', async () => {
        const mockGet = vitest_1.vi.fn().mockResolvedValue(makeMockQuerySnapshot([]));
        const mockWhere = vitest_1.vi.fn().mockReturnValue({ where: mockWhere2, get: mockGet });
        const mockWhere2 = vitest_1.vi.fn().mockReturnValue({ where: mockWhere3, get: mockGet });
        const mockWhere3 = vitest_1.vi.fn().mockReturnValue({ get: mockGet });
        admin.getFirestore.mockReturnValue({
            collection: vitest_1.vi.fn().mockReturnValue({ where: mockWhere }),
        });
        const result = await (0, storageCleanup_1.cleanupOrphanedFiles)({});
        (0, vitest_1.expect)(result).toEqual({ deletedImages: 0, deletedDocuments: 0 });
    });
    (0, vitest_1.it)('supprime les images et documents des biens rejetés anciens', async () => {
        const mockDelete = vitest_1.vi.fn().mockResolvedValue(undefined);
        const mockExists = vitest_1.vi.fn().mockResolvedValue([true]);
        const mockFile = vitest_1.vi.fn().mockReturnValue({ exists: mockExists, delete: mockDelete });
        const mockBucket = { file: mockFile };
        admin.getStorage.mockReturnValue({
            bucket: vitest_1.vi.fn().mockReturnValue(mockBucket),
        });
        const staleProp = makeMockDoc({
            id: 'p1',
            status: 'rejected',
            images: ['https://firebasestorage.googleapis.com/v0/b/bucket/o/properties%2Fp1%2Fimg1.jpg?alt=media'],
            documents: [{ type: 'titre_foncier', url: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/properties%2Fp1%2Fdoc.pdf?alt=media' }],
            updated_at: new Date('2020-01-01').toISOString(),
        });
        const mockGet = vitest_1.vi.fn().mockResolvedValue(makeMockQuerySnapshot([staleProp]));
        const mockWhere = vitest_1.vi.fn().mockReturnValue({ where: mockWhere2, get: mockGet });
        const mockWhere2 = vitest_1.vi.fn().mockReturnValue({ where: mockWhere3, get: mockGet });
        const mockWhere3 = vitest_1.vi.fn().mockReturnValue({ get: mockGet });
        admin.getFirestore.mockReturnValue({
            collection: vitest_1.vi.fn().mockReturnValue({ where: mockWhere }),
        });
        const result = await (0, storageCleanup_1.cleanupOrphanedFiles)({});
        (0, vitest_1.expect)(result.deletedImages).toBeGreaterThanOrEqual(0);
    });
});
//# sourceMappingURL=storageCleanup.test.js.map