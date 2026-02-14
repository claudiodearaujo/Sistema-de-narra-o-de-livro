/**
 * FaceStep Component (Step 4)
 * Optional fields: faceShape, forehead, cheekbones, chin, jaw, nose, lips, expression, beard, mustache, wrinkles, dimples, freckles
 */

import { WizardStep } from '../WizardStep';
import { FormField } from '../FormField';
import type { CharacterFormData, SelectOption } from '../types/character-wizard.types';

const FACE_SHAPE_OPTIONS: SelectOption[] = [
  { value: 'Oval', label: 'Oval' },
  { value: 'Redondo', label: 'Redondo' },
  { value: 'Quadrado', label: 'Quadrado' },
  { value: 'Retangular', label: 'Retangular' },
  { value: 'Coração', label: 'Coração' },
  { value: 'Diamante', label: 'Diamante' },
];

interface FaceStepProps {
  data: CharacterFormData;
  onChange: (data: Partial<CharacterFormData>) => void;
  isLoading?: boolean;
}

export function FaceStep({
  data,
  onChange,
  isLoading = false,
}: FaceStepProps) {
  const handleFaceChange = (field: string, value: any) => {
    onChange({
      face: {
        ...data.face,
        [field]: value,
      },
    });
  };

  return (
    <WizardStep
      title="Características Faciais"
      description="Informações opcionais sobre a forma e características do rosto."
      isLoading={isLoading}
    >
      {/* Face Shape */}
      <FormField
        label="Formato do Rosto"
        name="faceShape"
        type="select"
        value={data.face?.faceShape || ''}
        onChange={(value) => handleFaceChange('faceShape', value)}
        options={FACE_SHAPE_OPTIONS}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Forehead */}
        <FormField
          label="Testa"
          name="forehead"
          type="text"
          value={data.face?.forehead || ''}
          onChange={(value) => handleFaceChange('forehead', value)}
          placeholder="Ex: Alta, Baixa, Larga"
          maxLength={100}
        />

        {/* Cheekbones */}
        <FormField
          label="Maçãs do Rosto"
          name="cheekbones"
          type="text"
          value={data.face?.cheekbones || ''}
          onChange={(value) => handleFaceChange('cheekbones', value)}
          placeholder="Ex: Proeminentes, Suaves"
          maxLength={100}
        />

        {/* Chin */}
        <FormField
          label="Queixo"
          name="chin"
          type="text"
          value={data.face?.chin || ''}
          onChange={(value) => handleFaceChange('chin', value)}
          placeholder="Ex: Proeminente, Fraco, Quadrado"
          maxLength={100}
        />

        {/* Jaw */}
        <FormField
          label="Mandíbula"
          name="jaw"
          type="text"
          value={data.face?.jaw || ''}
          onChange={(value) => handleFaceChange('jaw', value)}
          placeholder="Ex: Marcada, Arredondada"
          maxLength={100}
        />

        {/* Nose */}
        <FormField
          label="Nariz"
          name="nose"
          type="text"
          value={data.face?.nose || ''}
          onChange={(value) => handleFaceChange('nose', value)}
          placeholder="Ex: Aquilino, Reto, Pequeno"
          maxLength={100}
        />

        {/* Lips */}
        <FormField
          label="Lábios"
          name="lips"
          type="text"
          value={data.face?.lips || ''}
          onChange={(value) => handleFaceChange('lips', value)}
          placeholder="Ex: Cheios, Finos, Bem definidos"
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expression */}
        <FormField
          label="Expressão Facial"
          name="expression"
          type="text"
          value={data.face?.expression || ''}
          onChange={(value) => handleFaceChange('expression', value)}
          placeholder="Ex: Séria, Alegre, Severa"
          maxLength={100}
        />

        {/* Beard */}
        <FormField
          label="Barba"
          name="beard"
          type="text"
          value={data.face?.beard || ''}
          onChange={(value) => handleFaceChange('beard', value)}
          placeholder="Ex: Nenhuma, Cerrada, Curta"
          maxLength={100}
        />

        {/* Mustache */}
        <FormField
          label="Bigode"
          name="mustache"
          type="text"
          value={data.face?.mustache || ''}
          onChange={(value) => handleFaceChange('mustache', value)}
          placeholder="Ex: Nenhum, Fino, Volumoso"
          maxLength={100}
        />

        {/* Wrinkles */}
        <FormField
          label="Rugas"
          name="wrinkles"
          type="text"
          value={data.face?.wrinkles || ''}
          onChange={(value) => handleFaceChange('wrinkles', value)}
          placeholder="Ex: Profundas, Suaves, Nenhuma"
          maxLength={100}
        />

        {/* Dimples */}
        <FormField
          label="Covinhas"
          name="dimples"
          type="text"
          value={data.face?.dimples || ''}
          onChange={(value) => handleFaceChange('dimples', value)}
          placeholder="Ex: Sim, Não, Apenas uma"
          maxLength={100}
        />

        {/* Freckles */}
        <FormField
          label="Sardas"
          name="freckles"
          type="text"
          value={data.face?.freckles || ''}
          onChange={(value) => handleFaceChange('freckles', value)}
          placeholder="Ex: Muitas, Poucas, Nenhuma"
          maxLength={100}
        />
      </div>

      {/* Helper text */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3 mt-4">
        <p className="text-xs text-blue-200">
          💡 <strong>Dica:</strong> Descreva características faciais que tornem o personagem visualmente
          distintivo e memorável.
        </p>
      </div>
    </WizardStep>
  );
}
