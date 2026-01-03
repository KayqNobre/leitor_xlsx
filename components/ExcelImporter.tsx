// components/ExcelImporter.tsx - VERSÃO COM CONSOLE.LOG
import React, { useState } from 'react';
import {
  View,
  Button,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';

// Interface para ativo
interface Ativo {
  id: string;      // Número do ativo
  nome: string;    // Nome
}

const ExcelImporter: React.FC = () => {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  // Função de importação SIMPLES
  const importExcelFile = async () => {
    try {
      setLoading(true);
      setAtivos([]);
      
      // 1. Selecionar arquivo
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets?.[0];
      if (!file) {
        Alert.alert('Erro', 'Nenhum arquivo selecionado');
        setLoading(false);
        return;
      }

      setFileName(file.name);
      
      // 2. Ler arquivo
      const response = await fetch(file.uri);
      const arrayBuffer = await response.arrayBuffer();
      
      // 3. Processar Excel
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
      }) as any[][];

      // 4. Extrair apenas as 2 primeiras colunas
      const novosAtivos: Ativo[] = [];
      
      // Pula a primeira linha (cabeçalho) e processa o resto
      for (let i = 1; i < jsonData.length; i++) {
        const linha = jsonData[i];
        
        if (Array.isArray(linha) && linha.length >= 2) {
          const numero = String(linha[0] || '').trim();
          const nome = String(linha[1] || '').trim();
          
          // Só adiciona se tiver número
          if (numero) {
            novosAtivos.push({
              id: `${numero}-${i}`, // CHAVE ÚNICA: combina número com índice
              nome: nome || `Ativo ${numero}`,
            });
          }
        }
      }

      // LOG 1: Mostra os dados brutos da planilha (apenas as primeiras 5 linhas para não poluir)
      console.log('📊 DADOS BRUTOS DA PLANILHA (primeiras 5 linhas):');
      jsonData.slice(0, 5).forEach((linha, idx) => {
        console.log(`Linha ${idx}:`, linha);
      });

      // LOG 2: Mostra a estrutura dos ativos extraídos
      console.log('🎯 ATIVOS EXTRAÍDOS:');
      novosAtivos.forEach((ativo, idx) => {
        console.log(`Ativo ${idx + 1}:`, ativo);
      });

      // LOG 3: Mostra o array completo de ativos
      console.log('📦 ARRAY COMPLETO DE ATIVOS:', novosAtivos);

      setAtivos(novosAtivos);
      
      Alert.alert(
        '✅ Importado!',
        `${novosAtivos.length} ativos encontrados`
      );
      
    } catch (error: any) {
      console.error('Erro:', error);
      Alert.alert('❌ Erro', 'Não foi possível importar o arquivo');
    } finally {
      setLoading(false);
    }
  };

  // Limpar dados
  const limparDados = () => {
    console.log('🗑️ Limpando dados...');
    console.log('Estado antes de limpar:', ativos);
    setAtivos([]);
    setFileName('');
    console.log('Estado depois de limpar:', []);
  };

  // LOG 4: Mostra o estado atual sempre que ele mudar
  React.useEffect(() => {
    console.log('🔄 ESTADO ATUAL DE ATIVOS:', ativos);
    console.log('📏 Quantidade de ativos:', ativos.length);
  }, [ativos]);

  return (
    <View style={styles.container}>
      {/* Cabeçalho simples */}
      <Text style={styles.titulo}>📋 Importador de Ativos</Text>
      
      {/* Botão de importação */}
      <View style={styles.botaoContainer}>
        <Button
          title={loading ? "Importando..." : "Importar Excel"}
          onPress={importExcelFile}
          disabled={loading}
          color="#2196F3"
        />
      </View>

      {/* Carregando */}
      {loading && (
        <View style={styles.carregando}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.carregandoTexto}>Processando arquivo...</Text>
        </View>
      )}

      {/* Nome do arquivo */}
      {fileName && !loading && (
        <View style={styles.arquivoInfo}>
          <Text style={styles.arquivoNome}>Arquivo: {fileName}</Text>
        </View>
      )}

      {/* Resumo */}
      {ativos.length > 0 && (
        <View style={styles.resumo}>
          <Text style={styles.resumoTexto}>
            📊 {ativos.length} ativos importados
          </Text>
        </View>
      )}

      {/* Lista de ativos */}
      <ScrollView style={styles.listaContainer}>
        {ativos.length === 0 ? (
          <View style={styles.listaVazia}>
            <Text style={styles.listaVaziaTexto}>
              {fileName ? 'Nenhum ativo encontrado' : 'Importe um arquivo Excel'}
            </Text>
            <Text style={styles.listaVaziaSubtexto}>
              Arquivo deve ter: Número do Ativo | Nome
            </Text>
          </View>
        ) : (
          ativos.map((ativo, index) => (
            <View 
              key={ativo.id} // CHAVE ÚNICA garantida
              style={[
                styles.item,
                index % 2 === 0 ? styles.itemPar : styles.itemImpar
              ]}
            >
              <View style={styles.itemCabecalho}>
                <Text style={styles.itemNumero}>
                  #{index + 1}
                </Text>
                <Text style={styles.itemAtivo}>
                  {ativo.id.split('-')[0]} {/* Mostra só o número do ativo */}
                </Text>
              </View>
              <Text style={styles.itemNome}>
                {ativo.nome}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Botão limpar */}
      {ativos.length > 0 && (
        <View style={styles.botaoContainer}>
          <Button
            title="🗑️ Limpar Lista"
            onPress={limparDados}
            color="#F44336"
          />
        </View>
      )}
    </View>
  );
};

// ESTILOS SIMPLIFICADOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#333',
  },
  botaoContainer: {
    marginBottom: 16,
  },
  carregando: {
    alignItems: 'center',
    marginVertical: 16,
  },
  carregandoTexto: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  arquivoInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  arquivoNome: {
    fontSize: 14,
    color: '#0d47a1',
  },
  resumo: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  resumoTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    textAlign: 'center',
  },
  listaContainer: {
    flex: 1,
    marginBottom: 16,
  },
  listaVazia: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  listaVaziaTexto: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  listaVaziaSubtexto: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  item: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemPar: {
    backgroundColor: '#ffffff',
  },
  itemImpar: {
    backgroundColor: '#f5f5f5',
  },
  itemCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemNumero: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  itemAtivo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  itemNome: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
});

export default ExcelImporter;