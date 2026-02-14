/**
 * IdentityStep Component (Step 2)
 * Optional fields: gender, age, nationality, occupation, birthDate, birthPlace, personality, background
 */

import { WizardStep } from '../WizardStep';
import { FormField } from '../FormField';
import type { CharacterFormData, SelectOption } from '../types/character-wizard.types';

const GENDER_OPTIONS: SelectOption[] = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Feminino', label: 'Feminino' },
  { value: 'Outro', label: 'Outro' },
  { value: 'Não especificado', label: 'Não especificado' },
];

interface IdentityStepProps {
  data: CharacterFormData;
  onChange: (data: Partial<CharacterFormData>) => void;
  isLoading?: boolean;
}

export function IdentityStep({
  data,
  onChange,
  isLoading = false,
}: IdentityStepProps) {
  const handleIdentityChange = (field: string, value: any) => {
    onChange({
      identity: {
        ...data.identity,
        [field]: value,
      },
    });
  };

  return (
    <WizardStep
      title="Identidade do Personagem"
      description="Informações opcionais sobre a identidade e história do personagem."
      isLoading={isLoading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gender */}
        <FormField
          label="Gênero"
          name="gender"
          type="select"
          value={data.identity?.gender || ''}
          onChange={(value) => handleIdentityChange('gender', value)}
          options={GENDER_OPTIONS}
        />

        {/* Age */}
        <FormField
          label="Idade"
          name="age"
          type="number"
          value={data.identity?.age || ''}
          onChange={(value) => handleIdentityChange('age', value ? parseInt(value as string) : '')}
          placeholder="Ex: 25"
          min={0}
          max={200}
        />

        {/* Nationality */}
        <FormField
          label="Nacionalidade"
          name="nationality"
          type="text"
          value={data.identity?.nationality || ''}
          onChange={(value) => handleIdentityChange('nationality', value)}
          placeholder="Ex: Brasileiro, Português"
          maxLength={50}
        />

        {/* Occupation */}
        <FormField
          label="Ocupação"
          name="occupation"
          type="text"
          value={data.identity?.occupation || ''}
          onChange={(value) => handleIdentityChange('occupation', value)}
          placeholder="Ex: Médico, Professor, Comerciante"
          maxLength={100}
        />

        {/* Birth Date */}
        <FormField
          label="Data de Nascimento"
          name="birthDate"
          type="date"
          value={data.identity?.birthDate || ''}
          onChange={(value) => handleIdentityChange('birthDate', value)}
        />

        {/* Birth Place */}
        <FormField
          label="Local de Nascimento"
          name="birthPlace"
          type="text"
          value={data.identity?.birthPlace || ''}
          onChange={(value) => handleIdentityChange('birthPlace', value)}
          placeholder="Ex: São Paulo, Rio de Janeiro"
          maxLength={100}
        />
      </div>

      <div className="border-t border-zinc-700 pt-4 space-y-4">
        {/* Personality */}
        <FormField
          label="Personalidade"
          name="personality"
          type="textarea"
          value={data.identity?.personality || ''}
          onChange={(value) => handleIdentityChange('personality', value)}
          placeholder="Descreva traços de personalidade, comportamentos característicos, etc."
          rows={4}
          maxLength={1000}
        />

        {/* Background */}
        <FormField
          label="Histórico / Background"
          name="background"
          type="textarea"
          value={data.identity?.background || ''}
          onChange={(value) => handleIdentityChange('background', value)}
          placeholder="Contexto histórico do personagem, eventos importantes da vida, motivações, etc."
          rows={4}
          maxLength={1000}
        />
      </div>

      {/* Helper text */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3 mt-4">
        <p className="text-xs text-blue-200">
          💡 <strong>Dica:</strong> Quanto mais detalhes você preencher, melhor o sistema poderá gerar narrações
          consistentes com o personagem.
        </p>
      </div>
    </WizardStep>
  );
}
