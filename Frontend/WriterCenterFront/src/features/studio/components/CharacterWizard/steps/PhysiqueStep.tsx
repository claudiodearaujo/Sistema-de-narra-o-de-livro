/**
 * PhysiqueStep Component (Step 3)
 * Optional fields: height, weight, bodyType, waist, posture, skinTone, skinTexture, scars, tattoos, birthmarks
 */

import { WizardStep } from '../WizardStep';
import { FormField } from '../FormField';
import type { CharacterFormData, SelectOption } from '../types/character-wizard.types';

const BODY_TYPE_OPTIONS: SelectOption[] = [
  { value: 'Magra', label: 'Magra' },
  { value: 'Atlética', label: 'Atlética' },
  { value: 'Média', label: 'Média' },
  { value: 'Robusta', label: 'Robusta' },
  { value: 'Musculosa', label: 'Musculosa' },
];

const POSTURE_OPTIONS: SelectOption[] = [
  { value: 'Erguida', label: 'Erguida' },
  { value: 'Relaxada', label: 'Relaxada' },
  { value: 'Curvada', label: 'Curvada' },
  { value: 'Rígida', label: 'Rígida' },
];

interface PhysiqueStepProps {
  data: CharacterFormData;
  onChange: (data: Partial<CharacterFormData>) => void;
  isLoading?: boolean;
}

export function PhysiqueStep({
  data,
  onChange,
  isLoading = false,
}: PhysiqueStepProps) {
  const handlePhysiqueChange = (field: string, value: any) => {
    onChange({
      physique: {
        ...data.physique,
        [field]: value,
      },
    });
  };

  return (
    <WizardStep
      title="Características Físicas"
      description="Informações opcionais sobre a estrutura física e características do corpo."
      isLoading={isLoading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Height */}
        <FormField
          label="Altura"
          name="height"
          type="text"
          value={data.physique?.height || ''}
          onChange={(value) => handlePhysiqueChange('height', value)}
          placeholder="Ex: 1,80m, 175cm"
          maxLength={30}
        />

        {/* Weight */}
        <FormField
          label="Peso"
          name="weight"
          type="text"
          value={data.physique?.weight || ''}
          onChange={(value) => handlePhysiqueChange('weight', value)}
          placeholder="Ex: 75kg, 165 libras"
          maxLength={30}
        />

        {/* Body Type */}
        <FormField
          label="Tipo de Corpo"
          name="bodyType"
          type="select"
          value={data.physique?.bodyType || ''}
          onChange={(value) => handlePhysiqueChange('bodyType', value)}
          options={BODY_TYPE_OPTIONS}
        />

        {/* Waist */}
        <FormField
          label="Cintura"
          name="waist"
          type="text"
          value={data.physique?.waist || ''}
          onChange={(value) => handlePhysiqueChange('waist', value)}
          placeholder="Ex: 80cm"
          maxLength={30}
        />

        {/* Posture */}
        <FormField
          label="Postura"
          name="posture"
          type="select"
          value={data.physique?.posture || ''}
          onChange={(value) => handlePhysiqueChange('posture', value)}
          options={POSTURE_OPTIONS}
        />

        {/* Skin Tone */}
        <FormField
          label="Tom de Pele"
          name="skinTone"
          type="text"
          value={data.physique?.skinTone || ''}
          onChange={(value) => handlePhysiqueChange('skinTone', value)}
          placeholder="Ex: Claro, Moreno, Escuro"
          maxLength={50}
        />
      </div>

      <div className="border-t border-zinc-700 pt-4">
        {/* Skin Texture */}
        <FormField
          label="Textura da Pele"
          name="skinTexture"
          type="text"
          value={data.physique?.skinTexture || ''}
          onChange={(value) => handlePhysiqueChange('skinTexture', value)}
          placeholder="Ex: Lisa, Áspera, Oleosa, Seca"
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Scars */}
        <FormField
          label="Cicatrizes"
          name="scars"
          type="textarea"
          value={data.physique?.scars || ''}
          onChange={(value) => handlePhysiqueChange('scars', value)}
          placeholder="Descreva cicatrizes notáveis e suas localizações"
          rows={3}
          maxLength={500}
        />

        {/* Tattoos */}
        <FormField
          label="Tatuagens"
          name="tattoos"
          type="textarea"
          value={data.physique?.tattoos || ''}
          onChange={(value) => handlePhysiqueChange('tattoos', value)}
          placeholder="Descreva tatuagens, suas formas e significados"
          rows={3}
          maxLength={500}
        />
      </div>

      {/* Birthmarks */}
      <FormField
        label="Marcas de Nascença"
        name="birthmarks"
        type="textarea"
        value={data.physique?.birthmarks || ''}
        onChange={(value) => handlePhysiqueChange('birthmarks', value)}
        placeholder="Descreva marcas de nascença e outras marcas permanentes"
        rows={3}
        maxLength={500}
      />

      {/* Helper text */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3 mt-4">
        <p className="text-xs text-blue-200">
          💡 <strong>Dica:</strong> Detalhes como cicatrizes e tatuagens ajudam a criar uma narrativa visual
          mais consistente do personagem.
        </p>
      </div>
    </WizardStep>
  );
}
