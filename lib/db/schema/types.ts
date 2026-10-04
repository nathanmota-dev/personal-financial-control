import { accountTypes,allocationTypes,categoryGroups,creditCardBillPaymentKinds,creditCardBillStatuses,creditCardChargeKinds,goalCategories,goalStatuses,investmentAssetClasses,investmentInstrumentTypes,investmentReductionEventTypes,investmentReductionSourceTypes,investmentReductionStatuses,recurringStatuses,recurringTransactionTypes,transactionFundingLinkTypes,transactionStatuses,transactionTypes } from "./enums";

export type AccountType = (typeof accountTypes)[number];

export type CategoryGroup = (typeof categoryGroups)[number];

export type TransactionType = (typeof transactionTypes)[number];

export type RecurringTransactionType = (typeof recurringTransactionTypes)[number];

export type InvestmentReductionEventType = (typeof investmentReductionEventTypes)[number];

export type InvestmentReductionSourceType = (typeof investmentReductionSourceTypes)[number];

export type InvestmentReductionStatus = (typeof investmentReductionStatuses)[number];

export type TransactionFundingLinkType = (typeof transactionFundingLinkTypes)[number];

export type TransactionStatus = (typeof transactionStatuses)[number];

export type CreditCardBillStatus = (typeof creditCardBillStatuses)[number];

export type CreditCardBillPaymentKind = (typeof creditCardBillPaymentKinds)[number];

export type CreditCardChargeKind = (typeof creditCardChargeKinds)[number];

export type RecurringStatus = (typeof recurringStatuses)[number];

export type GoalCategory = (typeof goalCategories)[number];

export type GoalStatus = (typeof goalStatuses)[number];

export type AllocationType = (typeof allocationTypes)[number];

export type InvestmentAssetClass = (typeof investmentAssetClasses)[number];

export type InvestmentInstrumentType = (typeof investmentInstrumentTypes)[number];
