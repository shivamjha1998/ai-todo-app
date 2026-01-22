import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform, SafeAreaView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Checkbox from 'expo-checkbox';
import { fetchTasks, createTask, deleteTask, updateTask } from '../services/api';
import type { Task, CreateTaskDto } from '../types';

import AddIcon from '../../assets/add.svg';
import CalenderIcon from '../../assets/calender.svg';

export default function TaskListScreen() {
    const navigation = useNavigation<any>();
    const { logout, user } = useAuth();
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
        setShowDatePicker(false);
        if (selectedDate) {
            setDueDate(currentDate);
        }
    };

    const renderItem = ({ item }: { item: Task }) => (
        <TouchableOpacity
            style={[styles.card, item.priority === 'HIGH' && item.status !== 'COMPLETED' && styles.highPriority]}
            onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
        >
            <View style={styles.cardHeader}>
                <Checkbox
                    style={styles.checkbox}
                    value={item.status === 'COMPLETED'}
                    onValueChange={() => toggleStatus(item)}
                    color={item.status === 'COMPLETED' ? '#7fba94' : undefined}
                />
                <Text style={[styles.taskTitle, item.status === 'COMPLETED' && styles.completedText]}>
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
                {item.dueDate && (
                    <View style={styles.dateContainer}>
                        <CalenderIcon width={20} height={20} />
                        <Text style={styles.dateText}>{new Date(item.dueDate).toLocaleDateString()}</Text>
                    </View>
                )}
                {item.aiStatus === 'PROCESSING' && <Text style={styles.badgeProcessing}>AI Analyzing...</Text>}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Hi {user?.name || 'there'}!</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <MaterialIcons name="logout" size={24} color="#666" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#5dcdf3" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={tasks}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
                    ListEmptyComponent={<Text style={styles.emptyText}>No tasks yet. Create one!</Text>}
                />

            )}

            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                <AddIcon width={30} height={30} />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalView}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>New Task</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="What needs to be done?"
                                placeholderTextColor="#666"
                                value={title}
                                onChangeText={setTitle}
                            />

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Description"
                                placeholderTextColor="#666"
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
                                        priority === p && p === 'HIGH' ? { backgroundColor: '#fa8a8b' } :
                                            priority === p && p === 'MEDIUM' ? { backgroundColor: '#f6bb40' } :
                                                priority === p && p === 'LOW' ? { backgroundColor: '#5dcdf3' } : {}
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
                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                    onChange={onChangeDate}
                                    textColor="#666"
                                    themeVariant="light"
                                    style={{ alignSelf: 'center' }}
                                />
                            )}

                            <View style={styles.modalButtons}>
                                <Button title="Cancel" onPress={() => setModalVisible(false)} color="#fd888b" />
                                <Button title="Create" onPress={handleCreateTask} />
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}

// Helper component for simple button
const Button = ({ title, onPress, color = '#60c9f7' }: any) => (
    <TouchableOpacity style={[styles.btn, { backgroundColor: color }]} onPress={onPress}>
        <Text style={styles.btnText}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eee8e6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    addButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#fa8a8b',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
        zIndex: 10,
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
        borderWidth: 1,
        borderColor: '#000',
        padding: 16,
        marginBottom: 12,
        borderBottomWidth: 5,
        borderBottomColor: '#000',
        borderRightWidth: 5,
        borderRightColor: '#000',
    },
    highPriority: {
        borderLeftWidth: 4,
        borderLeftColor: '#fa8a8b',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    checkbox: {
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#000',
        width: 25,
        height: 25,
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
        fontSize: 30,
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
        backgroundColor: '#fa8a8b',
        color: '#000',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 11,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#000',
    },
    badgeWarning: {
        backgroundColor: '#f6bb40',
        color: '#000',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 11,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#000',
    },
    badgeInfo: {
        backgroundColor: '#5dcdf3',
        color: '#000',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 11,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#000',
    },
    badgeProcessing: {
        backgroundColor: '#f6bb40',
        color: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 11,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#000',
    },
    dateText: {
        color: '#666',
        fontSize: 12,
        marginLeft: 4,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
        backgroundColor: '#eee8e6',
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        borderColor: '#000',
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
        borderColor: '#000',
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
        borderColor: '#000',
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
        borderColor: '#000',
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
        borderWidth: 1,
        borderColor: '#000',
        borderBottomWidth: 5,
        borderBottomColor: '#000',
        borderRightWidth: 5,
        borderRightColor: '#000',
    },
    btnText: {
        color: '#000',
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
