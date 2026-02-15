/**
 * BasicStep Component (Step 1)
 * Required fields: name, voiceId, voiceDescription
 */

import { useState, useEffect } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { WizardStep } from '../WizardStep';
import { FormField } from '../FormField';
import type { CharacterFormData, VoiceOption } from '../types/character-wizard.types';

const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'pt-BR-FranciscaNeural', label: 'Francisca (Feminino, BR)' },
  { id: 'pt-BR-AntonioNeural', label: 'Antonio (Masculino, BR)' },
  { id: 'pt-BR-BrendaNeural', label: 'Brenda (Feminino, BR)' },
  { id: 'pt-BR-DonatoNeural', label: 'Donato (Masculino, BR)' },
  { id: 'pt-BR-ElzaNeural', label: 'Elza (Feminino, BR)' },
  { id: 'pt-BR-FabioNeural', label: 'Fabio (Masculino, BR)' },
  { id: 'pt-BR-GiovannaNeural', label: 'Giovanna (Feminino, BR)' },
  { id: 'pt-BR-HumbertoNeural', label: 'Humberto (Masculino, BR)' },
  { id: 'pt-BR-JulioNeural', label: 'Julio (Masculino, BR)' },
  { id: 'pt-BR-LeilaNeural', label: 'Leila (Feminino, BR)' },
  { id: 'pt-BR-LeticiaNeural', label: 'Leticia (Feminino, BR)' },
  { id: 'pt-BR-ManuelaNeural', label: 'Manuela (Feminino, BR)' },
  { id: 'pt-BR-NicolauNeural', label: 'Nicolau (Masculino, BR)' },
  { id: 'pt-BR-ThalitaNeural', label: 'Thalita (Feminino, BR)' },
  { id: 'pt-BR-ValerioNeural', label: 'Valerio (Masculino, BR)' },
  { id: 'pt-BR-YaraNeural', label: 'Yara (Feminino, BR)' },
];

interface BasicStepProps {
  data: CharacterFormData;
  onChange: (data: Partial<CharacterFormData>) => void;
  onPreviewVoice?: (voiceId: string) => Promise<void>;
  isPreviewing?: boolean;
  isLoading?: boolean;
}

export function BasicStep({
  data,
  onChange,
  onPreviewVoice,
  isPreviewing = false,
  isLoading = false,
}: BasicStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate on change
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (!data.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (data.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!data.voiceId?.trim()) {
      newErrors.voiceId = 'Voz é obrigatória';
    }

    setErrors(newErrors);
  }, [data.name, data.voiceId]);

  const handlePreviewVoice = () => {
    if (onPreviewVoice && data.voiceId) {
      onPreviewVoice(data.voiceId);
    }
  };

  return (
    <WizardStep
      title="Dados Básicos do Personagem"
      description="Preenchimento obrigatório. Preencha os campos para prosseguir."
      isLoading={isLoading}
    >
      {/* Name */}
      <FormField
        label="Nome do Personagem"
        name="name"
        type="text"
        value={data.name || ''}
        onChange={(value) => onChange({ name: value as string })}
        placeholder="Ex: João Silva, Maria Santos"
        required
        error={errors.name}
        maxLength={100}
      />

      {/* Voice Selection */}
      <div className="space-y-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FormField
              label="Voz do Personagem"
              name="voiceId"
              type="select"
              value={data.voiceId || ''}
              onChange={(value) => onChange({ voiceId: value as string })}
              required
              error={errors.voiceId}
              options={VOICE_OPTIONS.map((voice) => ({
                value: voice.id,
                label: voice.label,
              }))}
            />
          </div>

          {/* Preview button */}
          <button
            type="button"
            onClick={handlePreviewVoice}
            disabled={isPreviewing || !onPreviewVoice || !data.voiceId}
            className="px-4 py-2 h-10 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            aria-label="Prévia de voz"
            title="Ouvir prévia da voz selecionada"
          >
            {isPreviewing ? (
              <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
            ) : (
              <Volume2 className="w-4 h-4 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Voice Description */}
      <FormField
        label="Descrição da Voz"
        name="voiceDescription"
        type="textarea"
        value={data.voiceDescription || ''}
        onChange={(value) => onChange({ voiceDescription: value as string })}
        placeholder="Descreva características especiais da voz como sotaque, tom, velocidade de fala, etc."
        rows={3}
        maxLength={500}
      />

      {/* Helper text */}
      <div className="bg-amber-900/20 border border-amber-700/50 rounded p-3">
        <p className="text-xs text-amber-200">
          ℹ️ <strong>Dica:</strong> Os campos marcados com <span className="text-red-400">*</span> são obrigatórios para prosseguir.
          Você poderá editar os dados específicos do personagem (identidade, físico, etc.) nas próximas etapas.
        </p>
      </div>
    </WizardStep>
  );
}
