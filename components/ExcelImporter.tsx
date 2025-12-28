// components/ExcelImporter.tsx - VERSÃO FINAL SEM EXPO-FILE-SYSTEM
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

const ExcelImporter: React.FC = () => {
  const [data, setData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  // Função que funciona em TODAS as plataformas
  const importExcelFile = async () => {
    try {
      setLoading(true);
      
      // PASSO 1: Selecionar arquivo
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          'text/csv',
        ],
        copyToCacheDirectory: true, // CRÍTICO para funcionar no mobile
        multiple: false,
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

      setFileName(file.name || 'Arquivo sem nome');
      console.log('📁 Processando arquivo:', file.name, 'URI:', file.uri);
      
      // PASSO 2: Usar fetch para ler o arquivo (funciona em mobile e web)
      const response = await fetch(file.uri);
      
      if (!response.ok) {
        throw new Error(`Falha ao ler arquivo: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // PASSO 3: Processar com SheetJS
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,        // Retorna array de arrays
        defval: '',       // Valor padrão para células vazias
        raw: false,       // Converte valores para string
      });

      // PASSO 4: Converter para array de arrays de strings
      const filteredData = (jsonData as any[])
        .filter((row: any) => 
          Array.isArray(row) && 
          row.some((cell: any) => 
            cell !== null && 
            cell !== undefined && 
            String(cell).trim() !== ''
          )
        )
        .map((row: any) => 
          row.map((cell: any) => 
            String(cell === null || cell === undefined ? '' : cell)
          )
        );

      setData(filteredData);
      
      Alert.alert(
        '✅ Sucesso!',
        `Arquivo "${file.name}" importado\n` +
        `${filteredData.length} linhas × ${filteredData[0]?.length || 0} colunas`,
      );
      
    } catch (error: any) {
      console.error('❌ Erro detalhado:', error);
      Alert.alert(
        '❌ Erro', 
        `Não foi possível importar:\n${error.message || 'Formato inválido'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Renderização dos dados
  const renderData = () => {
    if (data.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Sem dados</Text>
          <Text style={styles.emptySubtext}>
            Importe uma planilha Excel (.xlsx, .xls) ou CSV
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.dataContainer}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{data.length}</Text>
            <Text style={styles.statLabel}>Linhas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{data[0]?.length || 0}</Text>
            <Text style={styles.statLabel}>Colunas</Text>
          </View>
        </View>
        
        <ScrollView style={styles.tableContainer}>
          {data.slice(0, 20).map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              <Text style={styles.rowNumber}>{rowIndex + 1}</Text>
              <ScrollView horizontal>
                {row.map((cell, cellIndex) => (
                  <View key={cellIndex} style={styles.cell}>
                    <Text style={styles.cellText}>{cell}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ))}
          {data.length > 20 && (
            <Text style={styles.moreText}>
              ... e mais {data.length - 20} linhas
            </Text>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📈 Leitor de Excel</Text>
      </View>
      
      <View style={styles.buttonWrapper}>
        <Button
          title={loading ? "Processando..." : "📁 Importar Planilha"}
          onPress={importExcelFile}
          disabled={loading}
          color="#2196F3"
        />
      </View>
      
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Lendo arquivo...</Text>
        </View>
      )}
      
      {fileName && !loading && (
        <View style={styles.fileCard}>
          <Text style={styles.fileName}>📄 {fileName}</Text>
        </View>
      )}
      
      {renderData()}
      
      {data.length > 0 && (
        <View style={styles.actions}>
          <Button
            title="🗑️ Limpar Dados"
            onPress={() => {
              setData([]);
              setFileName('');
            }}
            color="#F44336"
          />
          <View style={styles.spacer} />
          <Button
            title="📋 Ver no Console"
            onPress={() => {
              console.log('📊 Dados importados:', data);
              Alert.alert('Console', 'Dados logados no console!');
            }}
            color="#4CAF50"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonWrapper: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loading: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  fileCard: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D47A1',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  dataContainer: {
    flex: 1,
    marginBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
    alignItems: 'center',
  },
  rowNumber: {
    width: 35,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginRight: 10,
  },
  cell: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    marginRight: 8,
    borderRadius: 4,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cellText: {
    fontSize: 12,
    color: '#333',
  },
  moreText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 10,
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  spacer: {
    width: 10,
  },
});

export default ExcelImporter;