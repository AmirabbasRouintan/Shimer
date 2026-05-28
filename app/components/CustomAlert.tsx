import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

interface CustomAlertProps {
  visible: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string | null;
  singleButton?: boolean;
  thirdButtonText?: string | null;
  onThirdButton?: (() => void) | null;
}

const CustomAlert = ({ visible, title, message, onConfirm, onCancel, confirmText = "OK", cancelText = null, singleButton = false, thirdButtonText = null, onThirdButton = null }: CustomAlertProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={styles.alertDivider} />
          <View style={styles.alertButtons}>
            {!singleButton && cancelText && (
              <>
                <TouchableOpacity style={styles.alertCancelButton} onPress={onCancel}>
                  <Text style={styles.alertCancelText}>{cancelText}</Text>
                </TouchableOpacity>
                <View style={styles.alertButtonDivider} />
              </>
            )}
            {!singleButton && thirdButtonText && onThirdButton && (
              <>
                <TouchableOpacity style={styles.alertThirdButton} onPress={onThirdButton}>
                  <Text style={styles.alertThirdButtonText}>{thirdButtonText}</Text>
                </TouchableOpacity>
                <View style={styles.alertButtonDivider} />
              </>
            )}
            <TouchableOpacity style={[styles.alertConfirmButton, singleButton && styles.alertSingleButton]} onPress={onConfirm}>
              <Text style={[styles.alertConfirmText, singleButton && styles.alertSingleButtonText]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertContainer: {
    backgroundColor: "#1c1c1e",
    borderRadius: 14,
    width: "80%",
    maxWidth: 320,
    overflow: "hidden",
  },
  alertTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  alertMessage: {
    color: "#8e8e93",
    fontSize: 13,
    textAlign: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 18,
  },
  alertDivider: {
    height: 0.5,
    backgroundColor: "#38383a",
  },
  alertButtons: {
    flexDirection: "row",
  },
  alertCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  alertCancelText: {
    color: "#ff3b30",
    fontSize: 17,
    fontWeight: "500",
  },
  alertThirdButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  alertThirdButtonText: {
    color: "#007aff",
    fontSize: 17,
    fontWeight: "500",
  },
  alertButtonDivider: {
    width: 0.5,
    backgroundColor: "#38383a",
  },
  alertConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  alertConfirmText: {
    color: "#007aff",
    fontSize: 17,
    fontWeight: "600",
  },
  alertSingleButton: {
    justifyContent: "center",
  },
  alertSingleButtonText: {
    fontWeight: "600",
  },
});

export default CustomAlert;
