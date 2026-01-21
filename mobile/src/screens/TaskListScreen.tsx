import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchTasks, createTask, deleteTask, updateTask } from '../services/api';
import type { Task, CreateTaskDto } from '../types';

export default function TaskListScreen() {
    const navigation = useNavigation<any>();
    const { logout } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Create Task State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const loadTasks = async () => {
        try {
            const data = await fetchTasks();
            setTasks(data);
        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadTasks();
            const interval = setInterval(() => {
                loadTasks();
            }, 5000);
            return () => clearInterval(interval);
        }, [])
    );

    const handleCreateTask = async () => {
        if (!title.trim()) return;

        try {
            const newTask: CreateTaskDto = {
                title,
                description: description || undefined,
                priority,
                dueDate: dueDate ? dueDate.toISOString() : undefined
            };
            await createTask(newTask);
            setModalVisible(false);
            resetForm();
            loadTasks();
        } catch (error) {
            Alert.alert('Error', 'Failed to create task');
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setDueDate(undefined);
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Delete Task",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        try {
                            await deleteTask(id);
                            setTasks(tasks.filter(t => t.id !== id));
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete');
                        }
                    }
                }
            ]
        );
    };

    const toggleStatus = async (task: Task) => {
        try {
            const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
            await updateTask(task.id, { status: newStatus });
            loadTasks();
        } catch (e) {
            console.error(e);
        }
    }

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || dueDate;
        setShowDatePicker(Platform.OS === 'ios');
        setDueDate(currentDate);
    };

    const renderItem = ({ item }: { item: Task }) => (
        <TouchableOpacity
            style={[styles.card, item.priority === 'HIGH' && item.status !== 'COMPLETED' && styles.highPriority]}
            onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
        >
            <View style={styles.cardHeader}>
                <TouchableOpacity onPress={() => toggleStatus(item)} style={styles.checkbox}>
                    <Text>{item.status === 'COMPLETED' ? '☑️' : '⬜️'}</Text>
                </TouchableOpacity>
                <Text style={[styles.taskTitle, item.status === 'COMPLETED' && styles.completedText]} numberOfLines={1}>
                    {item.title}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.optionButton}>
                    <Text style={styles.optionText}>⋮</Text>
                </TouchableOpacity>
            </View>

            {item.description ? (
                <Text numberOfLines={2} style={styles.description}>{item.description}</Text>
            ) : null}

            <View style={styles.meta}>
                {item.priority === 'HIGH' && <Text style={styles.badgeDanger}>High Priority</Text>}
                {item.priority === 'MEDIUM' && <Text style={styles.badgeWarning}>Medium Priority</Text>}
                {item.priority === 'LOW' && <Text style={styles.badgeInfo}>Low Priority</Text>}
                {item.dueDate && <Text style={styles.dateText}>📅 {new Date(item.dueDate).toLocaleDateString()}</Text>}
                {item.aiStatus === 'PROCESSING' && <Text style={styles.badgeProcessing}>AI Analyzing...</Text>}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Tasks</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <MaterialIcons name="logout" size={24} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                        <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={tasks}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No tasks yet. Create one!</Text>}
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Task</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="What needs to be done?"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Description"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />

                        <Text style={styles.label}>Priority</Text>
                        <View style={styles.priorityContainer}>
                            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.priorityButton, priority === p && styles.priorityButtonSelected,
                                    priority === p && p === 'HIGH' ? { backgroundColor: '#ff3b30' } :
                                        priority === p && p === 'MEDIUM' ? { backgroundColor: '#ff9500' } :
                                            priority === p && p === 'LOW' ? { backgroundColor: '#007AFF' } : {}
                                    ]}
                                    onPress={() => setPriority(p)}
                                >
                                    <Text style={[styles.priorityText, priority === p && { color: '#fff' }]}>{p}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Due Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.dateButtonText}>{dueDate ? dueDate.toLocaleDateString() : 'Set Due Date'}</Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={dueDate || new Date()}
                                mode="date"
                                is24Hour={true}
                                display="default"
                                onChange={onChangeDate}
                            />
                        )}

                        <View style={styles.modalButtons}>
                            <Button title="Cancel" onPress={() => setModalVisible(false)} color="gray" />
                            <Button title="Create" onPress={handleCreateTask} />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Helper component for simple button
const Button = ({ title, onPress, color = '#007AFF' }: any) => (
    <TouchableOpacity style={[styles.btn, { backgroundColor: color }]} onPress={onPress}>
        <Text style={styles.btnText}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    highPriority: {
        borderLeftWidth: 4,
        borderLeftColor: '#ff3b30',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    checkbox: {
        marginRight: 12,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    optionButton: {
        padding: 4,
        marginLeft: 8,
    },
    optionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
    },
    description: {
        color: '#666',
        marginBottom: 8,
    },
    meta: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 4,
    },
    badgeDanger: {
        backgroundColor: '#ff3b30',
        color: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 10,
        overflow: 'hidden',
    },
    badgeWarning: {
        backgroundColor: '#ff9500',
        color: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 10,
        overflow: 'hidden',
    },
    badgeInfo: {
        backgroundColor: '#007AFF',
        color: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 10,
        overflow: 'hidden',
    },
    badgeProcessing: {
        backgroundColor: '#E5E5EA',
        color: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 10,
        overflow: 'hidden',
    },
    dateText: {
        color: '#666',
        fontSize: 12,
        paddingVertical: 4,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
    modalView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 4,
    },
    priorityContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 8,
    },
    priorityButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    priorityButtonSelected: {
        borderColor: 'transparent',
    },
    priorityText: {
        fontWeight: '600',
        color: '#333',
    },
    dateButton: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 24,
        alignItems: 'center',
    },
    dateButtonText: {
        fontSize: 16,
        color: '#333',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 0,
        gap: 16,
    },
    btn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    logoutButton: {
        padding: 8,
    },
});
