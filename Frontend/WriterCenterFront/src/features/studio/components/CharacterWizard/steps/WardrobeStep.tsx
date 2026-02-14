/**
 * WardrobeStep Component (Step 7)
 * Optional fields: clothing style, topwear, bottomwear, dress, footwear, accessories, details
 */

import { WizardStep } from '../WizardStep';
import { FormField } from '../FormField';
import type { CharacterFormData, SelectOption } from '../types/character-wizard.types';

const CLOTHING_STYLE_OPTIONS: SelectOption[] = [
  { value: 'Casual', label: 'Casual' },
  { value: 'Formal', label: 'Formal' },
  { value: 'Esportivo', label: 'Esportivo' },
  { value: 'Elegante', label: 'Elegante' },
  { value: 'Boho', label: 'Boho' },
  { value: 'Streetwear', label: 'Streetwear' },
  { value: 'Clássico', label: 'Clássico' },
];

interface WardrobeStepProps {
  data: CharacterFormData;
  onChange: (data: Partial<CharacterFormData>) => void;
  isLoading?: boolean;
}

export function WardrobeStep({
  data,
  onChange,
  isLoading = false,
}: WardrobeStepProps) {
  const handleWardrobeChange = (field: string, value: any) => {
    onChange({
      wardrobe: {
        ...data.wardrobe,
        [field]: value,
      },
    });
  };

  return (
    <WizardStep
      title="Vestuário e Acessórios"
      description="Informações opcionais sobre roupas, sapatos e acessórios do personagem."
      isLoading={isLoading}
    >
      {/* Clothing Style */}
      <div className="p-3 bg-zinc-800/50 rounded border border-zinc-700 mb-4">
        <FormField
          label="Estilo Geral de Vestuário"
          name="clothingStyle"
          type="select"
          value={data.wardrobe?.clothingStyle || ''}
          onChange={(value) => handleWardrobeChange('clothingStyle', value)}
          options={CLOTHING_STYLE_OPTIONS}
        />
      </div>

      {/* Part of Top (Topwear) */}
      <div className="border-t border-zinc-700 pt-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Parte de Cima (Topwear)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            label="Tipo"
            name="topwear"
            type="text"
            value={data.wardrobe?.topwear || ''}
            onChange={(value) => handleWardrobeChange('topwear', value)}
            placeholder="Ex: Blusa, Camiseta, Jaqueta"
            maxLength={100}
          />
          <FormField
            label="Cor"
            name="topwearColor"
            type="text"
            value={data.wardrobe?.topwearColor || ''}
            onChange={(value) => handleWardrobeChange('topwearColor', value)}
            placeholder="Ex: Vermelha, Preta"
            maxLength={50}
          />
          <FormField
            label="Marca"
            name="topwearBrand"
            type="text"
            value={data.wardrobe?.topwearBrand || ''}
            onChange={(value) => handleWardrobeChange('topwearBrand', value)}
            placeholder="Ex: Nike, H&M"
            maxLength={50}
          />
        </div>
      </div>

      {/* Part of Bottom (Bottomwear) */}
      <div className="border-t border-zinc-700 pt-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Parte de Baixo (Bottomwear)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            label="Tipo"
            name="bottomwear"
            type="text"
            value={data.wardrobe?.bottomwear || ''}
            onChange={(value) => handleWardrobeChange('bottomwear', value)}
            placeholder="Ex: Calça, Short, Saia"
            maxLength={100}
          />
          <FormField
            label="Cor"
            name="bottomwearColor"
            type="text"
            value={data.wardrobe?.bottomwearColor || ''}
            onChange={(value) => handleWardrobeChange('bottomwearColor', value)}
            placeholder="Ex: Azul, Branca"
            maxLength={50}
          />
          <FormField
            label="Marca"
            name="bottomwearBrand"
            type="text"
            value={data.wardrobe?.bottomwearBrand || ''}
            onChange={(value) => handleWardrobeChange('bottomwearBrand', value)}
            placeholder="Ex: Levi's, Zara"
            maxLength={50}
          />
        </div>
      </div>

      {/* Dress (alternative) */}
      <div className="border-t border-zinc-700 pt-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Vestido (Alternativa)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            label="Tipo"
            name="dress"
            type="text"
            value={data.wardrobe?.dress || ''}
            onChange={(value) => handleWardrobeChange('dress', value)}
            placeholder="Ex: Vestido florido, Elegante"
            maxLength={100}
          />
          <FormField
            label="Cor"
            name="dressColor"
            type="text"
            value={data.wardrobe?.dressColor || ''}
            onChange={(value) => handleWardrobeChange('dressColor', value)}
            placeholder="Ex: Rosa, Preto"
            maxLength={50}
          />
          <FormField
            label="Marca"
            name="dressBrand"
            type="text"
            value={data.wardrobe?.dressBrand || ''}
            onChange={(value) => handleWardrobeChange('dressBrand', value)}
            placeholder="Ex: Gucci, Dior"
            maxLength={50}
          />
        </div>
      </div>

      {/* Footwear */}
      <div className="border-t border-zinc-700 pt-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Calçados (Footwear)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            label="Tipo"
            name="footwear"
            type="text"
            value={data.wardrobe?.footwear || ''}
            onChange={(value) => handleWardrobeChange('footwear', value)}
            placeholder="Ex: Sapato, Tênis, Bota"
            maxLength={100}
          />
          <FormField
            label="Cor"
            name="footwearColor"
            type="text"
            value={data.wardrobe?.footwearColor || ''}
            onChange={(value) => handleWardrobeChange('footwearColor', value)}
            placeholder="Ex: Marrom, Branco"
            maxLength={50}
          />
          <FormField
            label="Marca"
            name="footwearBrand"
            type="text"
            value={data.wardrobe?.footwearBrand || ''}
            onChange={(value) => handleWardrobeChange('footwearBrand', value)}
            placeholder="Ex: Adidas, Timberland"
            maxLength={50}
          />
        </div>
        <div className="mt-3">
          <FormField
            label="Altura de Salto"
            name="heelHeight"
            type="text"
            value={data.wardrobe?.heelHeight || ''}
            onChange={(value) => handleWardrobeChange('heelHeight', value)}
            placeholder="Ex: Sem salto, 5cm, 10cm"
            maxLength={50}
          />
        </div>
      </div>

      {/* Accessories */}
      <div className="border-t border-zinc-700 pt-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Acessórios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            label="Brincos"
            name="earrings"
            type="text"
            value={data.wardrobe?.earrings || ''}
            onChange={(value) => handleWardrobeChange('earrings', value)}
            placeholder="Ex: Nenhum, De pérola, Argola"
            maxLength={100}
          />
          <FormField
            label="Colar"
            name="necklace"
            type="text"
            value={data.wardrobe?.necklace || ''}
            onChange={(value) => handleWardrobeChange('necklace', value)}
            placeholder="Ex: Corrente de ouro, Pendente"
            maxLength={100}
          />
          <FormField
            label="Anéis"
            name="rings"
            type="text"
            value={data.wardrobe?.rings || ''}
            onChange={(value) => handleWardrobeChange('rings', value)}
            placeholder="Ex: Nenhum, De diamante, Simples"
            maxLength={100}
          />
          <FormField
            label="Pulseiras"
            name="bracelets"
            type="text"
            value={data.wardrobe?.bracelets || ''}
            onChange={(value) => handleWardrobeChange('bracelets', value)}
            placeholder="Ex: De couro, Metálica"
            maxLength={100}
          />
          <FormField
            label="Relógio"
            name="watch"
            type="text"
            value={data.wardrobe?.watch || ''}
            onChange={(value) => handleWardrobeChange('watch', value)}
            placeholder="Ex: Rolex, Smartwatch"
            maxLength={100}
          />
          <FormField
            label="Bolsa"
            name="bag"
            type="text"
            value={data.wardrobe?.bag || ''}
            onChange={(value) => handleWardrobeChange('bag', value)}
            placeholder="Ex: Mochila, Bolsa de couro"
            maxLength={100}
          />
          <FormField
            label="Chapéu"
            name="hat"
            type="text"
            value={data.wardrobe?.hat || ''}
            onChange={(value) => handleWardrobeChange('hat', value)}
            placeholder="Ex: Nenhum, Boné, Chapéu de abas"
            maxLength={100}
          />
          <FormField
            label="Lenço"
            name="scarf"
            type="text"
            value={data.wardrobe?.scarf || ''}
            onChange={(value) => handleWardrobeChange('scarf', value)}
            placeholder="Ex: Nenhum, De seda, De lã"
            maxLength={100}
          />
        </div>
      </div>

      {/* Details */}
      <div className="border-t border-zinc-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField
          label="Unhas"
          name="nails"
          type="text"
          value={data.wardrobe?.nails || ''}
          onChange={(value) => handleWardrobeChange('nails', value)}
          placeholder="Ex: Longas, Esmaltadas em vermelho"
          maxLength={100}
        />
        <FormField
          label="Perfume"
          name="perfume"
          type="text"
          value={data.wardrobe?.perfume || ''}
          onChange={(value) => handleWardrobeChange('perfume', value)}
          placeholder="Ex: Floral, Amadeirado"
          maxLength={100}
        />
      </div>

      {/* Helper text */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3 mt-4">
        <p className="text-xs text-blue-200">
          💡 <strong>Dica:</strong> O vestuário ajuda a definir a personalidade e classe social do personagem.
          Detalhes de acessórios tornam o personagem mais memorável e real.
        </p>
      </div>
    </WizardStep>
  );
}
