// components/ExcelImporter.tsx
import React, { useState } from 'react';
import {
  View,
  Button,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';

// Componente principal
const ExcelImporter: React.FC = () => {
  const [data, setData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const importExcelFile = async () => {
    try {
      setLoading(true);
      
      // Abrir seletor de arquivos
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

      setFileName(file.name || 'Arquivo sem nome');
      
      // Ler arquivo
      let fileContent: string;
      
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        fileContent = fileContent.split(',')[1];
      } else {
        fileContent = await FileSystem.readAsStringAsync(file.uri, {
          encoding: 'base64' as any,
        });
      }

      // Converter base64 para ArrayBuffer
      const binaryString = atob(fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Processar com SheetJS
      const workbook = XLSX.read(bytes.buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false,
      });

      // Formatar dados
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
        'Sucesso!',
        `Arquivo importado.\n${filteredData.length} linhas carregadas.`,
      );
      
    } catch (error: any) {
      console.error('Erro:', error);
      Alert.alert('Erro', 'Não foi possível importar o arquivo.');
    } finally {
      setLoading(false);
    }
  };

  // Renderização
  return (
    <View style={styles.container}>
      <Button
        title={loading ? "Processando..." : "📁 Importar Planilha"}
        onPress={importExcelFile}
        disabled={loading}
      />
      
      {loading && <ActivityIndicator size="large" style={styles.loader} />}
      
      {fileName ? (
        <Text style={styles.fileName}>Arquivo: {fileName}</Text>
      ) : null}
      
      {data.length > 0 && (
        <Text style={styles.summary}>
          📊 {data.length} linhas × {data[0]?.length || 0} colunas
        </Text>
      )}
      
      {data.length > 0 ? (
        <ScrollView style={styles.dataContainer}>
          {data.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              <Text style={styles.rowNumber}>{rowIndex + 1}:</Text>
              {row.map((cell, cellIndex) => (
                <Text key={cellIndex} style={styles.cell}>
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>
          Nenhum dado importado ainda. Clique no botão acima.
        </Text>
      )}
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    marginVertical: 15,
  },
  fileName: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  summary: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#2196F3',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  },
  dataContainer: {
    marginTop: 20,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 8,
    alignItems: 'flex-start',
  },
  rowNumber: {
    fontWeight: 'bold',
    color: '#666',
    marginRight: 10,
    minWidth: 30,
  },
  cell: {
    flex: 1,
    fontSize: 12,
    marginHorizontal: 2,
    padding: 4,
    backgroundColor: '#f9f9f9',
    borderRadius: 3,
  },
});

export default ExcelImporter;  // ← EXPORT DEFAULT ESSENCIAL!