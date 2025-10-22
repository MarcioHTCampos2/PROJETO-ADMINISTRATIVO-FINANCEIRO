import React, { useState } from 'react';
import { 
  Typography, 
  Box,
  Stepper,
  Step,
  StepLabel,
  Button
} from '@mui/material';
import InvoiceDataView from './InvoiceDataView';
import InvoiceAnalysis from './InvoiceAnalysis';
import SaveResult from './SaveResult';

const InvoiceResult = ({ data, onProcessAnother }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [savedData, setSavedData] = useState(null);
  
  if (!data) return null;

  const steps = ['Dados Extraídos', 'Análise no Banco', 'Resultado'];

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSaveSuccess = (savedData) => {
    setSavedData(savedData);
    setCurrentStep(2);
  };

  const handleProcessAnother = () => {
    if (onProcessAnother) {
      onProcessAnother();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <InvoiceDataView 
            data={data} 
            onNext={handleNextStep}
          />
        );

      case 1:
        return (
          <InvoiceAnalysis 
            data={data}
            onSaveSuccess={handleSaveSuccess}
            onBack={handleBackStep}
          />
        );

      case 2:
        return (
          <SaveResult 
            savedData={savedData}
            onProcessAnother={handleProcessAnother}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center" color="primary">
        Processamento Concluído
      </Typography>

      <Stepper activeStep={currentStep} sx={{ mb: 4, mt: 2 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent()}

      {/* Botão para processar outro PDF (sempre visível) */}
      {currentStep !== 2 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleProcessAnother}
          >
            Processar Outro PDF
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default InvoiceResult;
