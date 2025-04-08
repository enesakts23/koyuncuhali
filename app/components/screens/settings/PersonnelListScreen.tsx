import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import ThemedText from '../../ThemedText';
import IconSymbol from '../../ui/IconSymbol';

interface Personnel {
  id: number;
  Ad_Soyad: string;
  email: string;
  telefon: string;
  yetki: string;
}

interface PersonnelListScreenProps {
  onClose: () => void;
  userRole: string;
}

const ROLES = ['Operasyon Sorumlusu', 'Depo Görevlisi', 'Lojistik Sorumlusu'];

export default function PersonnelListScreen({ onClose, userRole }: PersonnelListScreenProps) {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Personnel | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      const response = await fetch('http://192.168.1.162:3000/api/users');
      const data = await response.json();
      // Patronu en üste al ve diğerlerini alfabetik sırala
      const sortedData = data.sort((a: Personnel, b: Personnel) => {
        if (a.yetki === 'Patron') return -1;
        if (b.yetki === 'Patron') return 1;
        return a.Ad_Soyad.localeCompare(b.Ad_Soyad);
      });
      setPersonnel(sortedData);
    } catch (error) {
      console.error('Personel listesi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRolePress = (person: Personnel) => {
    // Patron rolündeki kullanıcının yetkisi değiştirilemez
    if (person.yetki === 'Patron') return;
    
    if (userRole === 'Patron') {
      setSelectedPerson(person);
      setSelectedRole(person.yetki);
      setIsModalVisible(true);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedPerson || !selectedRole) return;

    try {
      const response = await fetch(`http://192.168.1.162:3000/api/users/${selectedPerson.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ yetki: selectedRole }),
      });

      if (!response.ok) {
        throw new Error('Yetki güncellenemedi');
      }

      await fetchPersonnel();
      setIsModalVisible(false);
      Alert.alert('Başarılı', 'Yetki başarıyla güncellendi');
    } catch (error) {
      console.error('Yetki güncelleme hatası:', error);
      Alert.alert('Hata', 'Yetki güncellenirken bir hata oluştu');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Patron':
        return '#00b51a';
      case 'Operasyon Sorumlusu':
        return '#2196F3';
      case 'Depo Görevlisi':
        return '#FF9800';
      case 'Lojistik Sorumlusu':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <IconSymbol name="arrow-left" size={24} color="#00b51a" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Personel Listesi</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00b51a" />
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {personnel.map((person) => (
            <View key={person.id} style={styles.personCard}>
              <View style={styles.personInfo}>
                <ThemedText style={styles.personName}>{person.Ad_Soyad}</ThemedText>
                <ThemedText style={styles.personEmail}>{person.email}</ThemedText>
                <ThemedText style={styles.personPhone}>{person.telefon}</ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => handleRolePress(person)}
                disabled={person.yetki === 'Patron'}
                style={[
                  styles.roleTag,
                  { backgroundColor: getRoleColor(person.yetki) + '15' }
                ]}
              >
                <ThemedText style={[styles.roleText, { color: getRoleColor(person.yetki) }]}>
                  {person.yetki}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Role Selection Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Yetki Seç</ThemedText>
            
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleOption,
                  selectedRole === role && styles.selectedRoleOption
                ]}
                onPress={() => setSelectedRole(role)}
              >
                <ThemedText style={[
                  styles.roleOptionText,
                  selectedRole === role && styles.selectedRoleOptionText
                ]}>
                  {role}
                </ThemedText>
              </TouchableOpacity>
            ))}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <ThemedText style={styles.cancelButtonText}>İptal</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveRole}
              >
                <ThemedText style={styles.saveButtonText}>Kaydet</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  personCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  personEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  personPhone: {
    fontSize: 14,
    color: '#666',
  },
  roleTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedRoleOption: {
    backgroundColor: '#00b51a15',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedRoleOptionText: {
    color: '#00b51a',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#00b51a',
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
}); 