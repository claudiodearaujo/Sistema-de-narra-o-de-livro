export interface Voice {
    id: string;
    name: string;
    gender: 'MALE' | 'FEMALE';
    languageCode: string;
    description?: string;
}
