import React, { useState } from 'react';
import { FileText, Download, Mail, Signature, PenLine } from 'lucide-react';
import { SignaturePad } from './SignaturePad';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Asset {
  id: number;
  name: string;
  patrimony_tag?: string;
  serial_number?: string;
  status: string;
  brand_model?: string;
}

interface Movement {
  id: number;
  type: string;
  collaborator?: string;
  technician?: string;
  created_at: string;
  assets: Asset[];
  store_name?: string;
}

interface ResponsibilityTermGeneratorProps {
  movement: Movement;
  onTermGenerated?: (termId: string, pdfBlob: Blob) => void;
}

export const ResponsibilityTermGenerator: React.FC<ResponsibilityTermGeneratorProps> = ({
  movement,
  onTermGenerated
}) => {
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipientData, setRecipientData] = useState({
    name: movement.collaborator || '',
    cpf: '',
    email: '',
    unit: movement.store_name || 'Matriz'
  });

  const generateTermNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = String(date.getTime()).slice(-6);
    return `TR-${year}${month}${day}-${time}`;
  };

  const generatePDF = async (withSignature: boolean = false) => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF();
      const termNumber = generateTermNumber();
      
      // Configurações
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 30;

      // Cabeçalho
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TERMO DE RESPONSABILIDADE DE ATIVOS DE TI', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Termo Nº: ${termNumber}`, margin, yPosition);
      pdf.text(`Data: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, pageWidth - margin - 40, yPosition);
      
      yPosition += 20;

      // Dados do Recebedor
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DADOS DO RECEBEDOR:', margin, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nome: ${recipientData.name}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`CPF/Matrícula: ${recipientData.cpf}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Unidade: ${recipientData.unit}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`E-mail: ${recipientData.email}`, margin, yPosition);
      
      yPosition += 20;

      // Lista de Itens
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ITENS RECEBIDOS:', margin, yPosition);
      
      yPosition += 15;
      
      // Cabeçalho da tabela
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Item', margin, yPosition);
      pdf.text('Patrimônio/Serial', margin + 80, yPosition);
      pdf.text('Estado', margin + 140, yPosition);
      
      yPosition += 5;
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Itens
      pdf.setFont('helvetica', 'normal');
      movement.assets.forEach((asset, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        
        const itemName = asset.name.length > 25 ? asset.name.substring(0, 25) + '...' : asset.name;
        const patrimony = asset.patrimony_tag || asset.serial_number || 'N/A';
        const estado = asset.status === 'Disponível' ? 'Novo/Bom' : 'Usado';
        
        pdf.text(`${index + 1}. ${itemName}`, margin, yPosition);
        pdf.text(patrimony, margin + 80, yPosition);
        pdf.text(estado, margin + 140, yPosition);
        yPosition += 8;
      });

      yPosition += 15;

      // Texto Jurídico
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TERMOS DE RESPONSABILIDADE:', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const termsText = [
        '1. O recebedor assume total responsabilidade pela conservação, guarda e uso adequado dos equipamentos/materiais relacionados neste termo.',
        '',
        '2. Compromete-se a utilizar os itens exclusivamente para atividades profissionais relacionadas às suas funções na empresa.',
        '',
        '3. Em caso de dano, perda, furto ou roubo, o recebedor deverá comunicar imediatamente ao setor responsável e poderá ser responsabilizado pelos custos de reparo ou substituição.',
        '',
        '4. A devolução dos itens deverá ocorrer em perfeito estado de conservação, considerando o desgaste natural pelo uso adequado.',
        '',
        '5. O não cumprimento das obrigações previstas neste termo poderá resultar em medidas disciplinares e/ou ressarcimento dos valores correspondentes.',
        '',
        '6. Este termo permanece válido até a devolução formal dos itens ou desligamento do colaborador da empresa.'
      ];

      termsText.forEach(line => {
        if (line === '') {
          yPosition += 4;
        } else {
          const splitText = pdf.splitTextToSize(line, pageWidth - 2 * margin);
          pdf.text(splitText, margin, yPosition);
          yPosition += splitText.length * 5;
        }
      });

      yPosition += 20;

      // Assinatura
      if (withSignature && signature) {
        pdf.text('Assinatura do Recebedor:', margin, yPosition);
        yPosition += 10;
        
        // Adicionar imagem da assinatura
        try {
          pdf.addImage(signature, 'PNG', margin, yPosition, 60, 20);
          yPosition += 25;
        } catch (error) {
          console.error('Erro ao adicionar assinatura:', error);
          yPosition += 20;
        }
      } else {
        pdf.text('Assinatura do Recebedor: _________________________________', margin, yPosition);
        yPosition += 20;
      }

      pdf.text(`Data: ___/___/______`, margin, yPosition);
      pdf.text('Responsável pela Entrega: _________________________________', margin + 100, yPosition);

      // Rodapé
      yPosition = pdf.internal.pageSize.getHeight() - 20;
      pdf.setFontSize(8);
      pdf.text('Este documento foi gerado automaticamente pelo Sistema de Inventário TI', pageWidth / 2, yPosition, { align: 'center' });

      const pdfBlob = pdf.output('blob');
      
      if (onTermGenerated) {
        onTermGenerated(termNumber, pdfBlob);
      }

      // Download automático
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Termo_Responsabilidade_${termNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o termo. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSignatureComplete = (signatureData: string) => {
    setSignature(signatureData);
    generatePDF(true);
  };

  return (
    <div className="space-y-4">
      {/* Formulário de dados do recebedor */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Dados do Recebedor</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={recipientData.name}
              onChange={(e) => setRecipientData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome do colaborador"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF/Matrícula *
            </label>
            <input
              type="text"
              value={recipientData.cpf}
              onChange={(e) => setRecipientData(prev => ({ ...prev, cpf: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="000.000.000-00 ou matrícula"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={recipientData.email}
              onChange={(e) => setRecipientData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidade
            </label>
            <input
              type="text"
              value={recipientData.unit}
              onChange={(e) => setRecipientData(prev => ({ ...prev, unit: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome da unidade/filial"
            />
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => generatePDF(false)}
          disabled={!recipientData.name || !recipientData.cpf || isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <FileText className="w-4 h-4" />
          {isGenerating ? 'Gerando...' : 'Gerar Termo (Sem Assinatura)'}
        </button>

        <button
          onClick={() => setShowSignaturePad(true)}
          disabled={!recipientData.name || !recipientData.cpf || isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <PenLine className="w-4 h-4" />
          Gerar com Assinatura Digital
        </button>
      </div>

      {/* Signature Pad Modal */}
      <SignaturePad
        isOpen={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        onSave={handleSignatureComplete}
        title="Assinatura do Termo de Responsabilidade"
      />
    </div>
  );
};