
export interface IAdminRequest {
    id: number;
    name: string;
    email: string;
    slug?: string;
    vaultIds: number[]
}
