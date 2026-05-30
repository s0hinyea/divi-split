import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';

interface InputWithFeedbackProps extends TextInputProps {
  errorText?: string;
  containerStyle?: object;
}

export function InputWithFeedback({ errorText, containerStyle, style, onChangeText, ...rest }: InputWithFeedbackProps) {
  const hasError = !!errorText;

  const handleChangeText = (text: string) => {
    onChangeText?.(text);
  };

  return (
    <View style={containerStyle}>
      <TextInput
        style={[
          styles.input,
          hasError && styles.inputError,
          style,
        ]}
        onChangeText={handleChangeText}
        placeholderTextColor={colors.gray400}
        {...rest}
      />
      {hasError && (
        <Text style={styles.errorText}>{errorText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.gray100,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.black,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}08`,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
