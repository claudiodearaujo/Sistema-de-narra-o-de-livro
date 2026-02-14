/**
 * EyesStep Component (Step 5)
 * Optional fields: eyeSize, eyeShape, eyeColor, eyeSpacing, eyelashes, eyebrowShape, eyebrowColor, eyebrowThickness, glasses, makeup
 */

import { WizardStep } from '../WizardStep';
import { FormField } from '../FormField';
import type { CharacterFormData, SelectOption } from '../types/character-wizard.types';

const EYE_SHAPE_OPTIONS: SelectOption[] = [
  { value: 'Amendoado', label: 'Amendoado' },
  { value: 'Redondo', label: 'Redondo' },
  { value: 'Caído', label: 'Caído' },
  { value: 'Rasgado', label: 'Rasgado' },
  { value: 'Saltado', label: 'Saltado' },
];

const EYE_COLOR_OPTIONS: SelectOption[] = [
  { value: 'Castanho', label: 'Castanho' },
  { value: 'Verde', label: 'Verde' },
  { value: 'Azul', label: 'Azul' },
  { value: 'Mel', label: 'Mel' },
  { value: 'Cinza', label: 'Cinza' },
  { value: 'Preto', label: 'Preto' },
  { value: 'Heterocromia', label: 'Heterocromia' },
];

interface EyesStepProps {
  data: CharacterFormData;
  onChange: (data: Partial<CharacterFormData>) => void;
  isLoading?: boolean;
}

export function EyesStep({
  data,
  onChange,
  isLoading = false,
}: EyesStepProps) {
  const handleEyesChange = (field: string, value: any) => {
    onChange({
      eyes: {
        ...data.eyes,
        [field]: value,
      },
    });
  };

  return (
    <WizardStep
      title="Características dos Olhos"
      description="Informações opcionais sobre os olhos e sobrancelhas."
      isLoading={isLoading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Eye Size */}
        <FormField
          label="Tamanho dos Olhos"
          name="eyeSize"
          type="text"
          value={data.eyes?.eyeSize || ''}
          onChange={(value) => handleEyesChange('eyeSize', value)}
          placeholder="Ex: Grandes, Pequenos, Médios"
          maxLength={50}
        />

        {/* Eye Shape */}
        <FormField
          label="Formato dos Olhos"
          name="eyeShape"
          type="select"
          value={data.eyes?.eyeShape || ''}
          onChange={(value) => handleEyesChange('eyeShape', value)}
          options={EYE_SHAPE_OPTIONS}
        />

        {/* Eye Color */}
        <FormField
          label="Cor dos Olhos"
          name="eyeColor"
          type="select"
          value={data.eyes?.eyeColor || ''}
          onChange={(value) => handleEyesChange('eyeColor', value)}
          options={EYE_COLOR_OPTIONS}
        />

        {/* Eye Spacing */}
        <FormField
          label="Espaçamento dos Olhos"
          name="eyeSpacing"
          type="text"
          value={data.eyes?.eyeSpacing || ''}
          onChange={(value) => handleEyesChange('eyeSpacing', value)}
          placeholder="Ex: Próximos, Afastados, Normal"
          maxLength={50}
        />

        {/* Eyelashes */}
        <FormField
          label="Cílios"
          name="eyelashes"
          type="text"
          value={data.eyes?.eyelashes || ''}
          onChange={(value) => handleEyesChange('eyelashes', value)}
          placeholder="Ex: Longos, Curtos, Volumosos"
          maxLength={100}
        />

        {/* Eyebrow Shape */}
        <FormField
          label="Formato da Sobrancelha"
          name="eyebrowShape"
          type="text"
          value={data.eyes?.eyebrowShape || ''}
          onChange={(value) => handleEyesChange('eyebrowShape', value)}
          placeholder="Ex: Arqueada, Reta, Grossa"
          maxLength={100}
        />

        {/* Eyebrow Color */}
        <FormField
          label="Cor da Sobrancelha"
          name="eyebrowColor"
          type="text"
          value={data.eyes?.eyebrowColor || ''}
          onChange={(value) => handleEyesChange('eyebrowColor', value)}
          placeholder="Ex: Preta, Castanha, Loira"
          maxLength={50}
        />

        {/* Eyebrow Thickness */}
        <FormField
          label="Espessura da Sobrancelha"
          name="eyebrowThickness"
          type="text"
          value={data.eyes?.eyebrowThickness || ''}
          onChange={(value) => handleEyesChange('eyebrowThickness', value)}
          placeholder="Ex: Grossa, Fina, Média"
          maxLength={50}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Glasses */}
        <FormField
          label="Óculos"
          name="glasses"
          type="text"
          value={data.eyes?.glasses || ''}
          onChange={(value) => handleEyesChange('glasses', value)}
          placeholder="Ex: Nenhum, Armação preta, Óculos de sol"
          maxLength={100}
        />

        {/* Makeup */}
        <FormField
          label="Maquiagem"
          name="makeup"
          type="text"
          value={data.eyes?.makeup || ''}
          onChange={(value) => handleEyesChange('makeup', value)}
          placeholder="Ex: Discreta, Dramática, Nenhuma"
          maxLength={100}
        />
      </div>

      {/* Helper text */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3 mt-4">
        <p className="text-xs text-blue-200">
          💡 <strong>Dica:</strong> Os olhos são frequentemente a primeira coisa que as pessoas notam.
          Detalhes específicos ajudam a criar uma representação visual consistente.
        </p>
      </div>
    </WizardStep>
  );
}
