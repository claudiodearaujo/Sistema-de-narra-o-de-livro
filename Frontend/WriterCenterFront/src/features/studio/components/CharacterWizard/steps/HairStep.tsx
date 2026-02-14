/**
 * HairStep Component (Step 6)
 * Optional fields: haircut, hairLength, hairColor, hairTexture, hairVolume, hairStyle, hairPart, hairShine, dyedColor, highlights
 */

import { WizardStep } from '../WizardStep';
import { FormField } from '../FormField';
import type { CharacterFormData, SelectOption } from '../types/character-wizard.types';

const HAIR_LENGTH_OPTIONS: SelectOption[] = [
  { value: 'Careca', label: 'Careca' },
  { value: 'Muito Curto', label: 'Muito Curto' },
  { value: 'Curto', label: 'Curto' },
  { value: 'Médio', label: 'Médio' },
  { value: 'Longo', label: 'Longo' },
  { value: 'Muito Longo', label: 'Muito Longo' },
];

const HAIR_COLOR_OPTIONS: SelectOption[] = [
  { value: 'Preto', label: 'Preto' },
  { value: 'Castanho Escuro', label: 'Castanho Escuro' },
  { value: 'Castanho Claro', label: 'Castanho Claro' },
  { value: 'Loiro', label: 'Loiro' },
  { value: 'Ruivo', label: 'Ruivo' },
  { value: 'Grisalho', label: 'Grisalho' },
  { value: 'Branco', label: 'Branco' },
];

const HAIR_TEXTURE_OPTIONS: SelectOption[] = [
  { value: 'Liso', label: 'Liso' },
  { value: 'Ondulado', label: 'Ondulado' },
  { value: 'Cacheado', label: 'Cacheado' },
  { value: 'Crespo', label: 'Crespo' },
];

interface HairStepProps {
  data: CharacterFormData;
  onChange: (data: Partial<CharacterFormData>) => void;
  isLoading?: boolean;
}

export function HairStep({
  data,
  onChange,
  isLoading = false,
}: HairStepProps) {
  const handleHairChange = (field: string, value: any) => {
    onChange({
      hair: {
        ...data.hair,
        [field]: value,
      },
    });
  };

  return (
    <WizardStep
      title="Características do Cabelo"
      description="Informações opcionais sobre o cabelo e penteados."
      isLoading={isLoading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hair Length */}
        <FormField
          label="Comprimento do Cabelo"
          name="hairLength"
          type="select"
          value={data.hair?.hairLength || ''}
          onChange={(value) => handleHairChange('hairLength', value)}
          options={HAIR_LENGTH_OPTIONS}
        />

        {/* Hair Color */}
        <FormField
          label="Cor do Cabelo"
          name="hairColor"
          type="select"
          value={data.hair?.hairColor || ''}
          onChange={(value) => handleHairChange('hairColor', value)}
          options={HAIR_COLOR_OPTIONS}
        />

        {/* Hair Texture */}
        <FormField
          label="Textura do Cabelo"
          name="hairTexture"
          type="select"
          value={data.hair?.hairTexture || ''}
          onChange={(value) => handleHairChange('hairTexture', value)}
          options={HAIR_TEXTURE_OPTIONS}
        />

        {/* Hair Texture */}
        <FormField
          label="Corte de Cabelo"
          name="haircut"
          type="text"
          value={data.hair?.haircut || ''}
          onChange={(value) => handleHairChange('haircut', value)}
          placeholder="Ex: Franja, Platinado, Desfiado"
          maxLength={100}
        />

        {/* Hair Volume */}
        <FormField
          label="Volume do Cabelo"
          name="hairVolume"
          type="text"
          value={data.hair?.hairVolume || ''}
          onChange={(value) => handleHairChange('hairVolume', value)}
          placeholder="Ex: Volumoso, Fino, Médio"
          maxLength={50}
        />

        {/* Hair Style */}
        <FormField
          label="Estilo do Cabelo"
          name="hairStyle"
          type="text"
          value={data.hair?.hairStyle || ''}
          onChange={(value) => handleHairChange('hairStyle', value)}
          placeholder="Ex: Solto, Trançado, Em coque"
          maxLength={100}
        />

        {/* Hair Part */}
        <FormField
          label="Repartição do Cabelo"
          name="hairPart"
          type="text"
          value={data.hair?.hairPart || ''}
          onChange={(value) => handleHairChange('hairPart', value)}
          placeholder="Ex: Meio, Lado direito, Sem repartição"
          maxLength={50}
        />

        {/* Hair Shine */}
        <FormField
          label="Brilho do Cabelo"
          name="hairShine"
          type="text"
          value={data.hair?.hairShine || ''}
          onChange={(value) => handleHairChange('hairShine', value)}
          placeholder="Ex: Brilhante, Opaco, Sedoso"
          maxLength={50}
        />
      </div>

      <div className="border-t border-zinc-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dyed Color */}
        <FormField
          label="Cor Tingida"
          name="dyedColor"
          type="text"
          value={data.hair?.dyedColor || ''}
          onChange={(value) => handleHairChange('dyedColor', value)}
          placeholder="Ex: Nenhuma, Roxo, Verde"
          maxLength={100}
        />

        {/* Highlights */}
        <FormField
          label="Mechas"
          name="highlights"
          type="text"
          value={data.hair?.highlights || ''}
          onChange={(value) => handleHairChange('highlights', value)}
          placeholder="Ex: Nenhuma, Loiras, Coloridas"
          maxLength={100}
        />
      </div>

      {/* Helper text */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3 mt-4">
        <p className="text-xs text-blue-200">
          💡 <strong>Dica:</strong> O cabelo é um elemento visual importante que define muito a aparência
          de um personagem. Detalhes como comprimento, cor e textura ajudam a criar uma imagem mental clara.
        </p>
      </div>
    </WizardStep>
  );
}
