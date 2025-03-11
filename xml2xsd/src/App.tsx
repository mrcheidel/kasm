import React, { useState, useEffect } from 'react';
import { FileCheck, AlertCircle, CheckCircle, Code, FileCode, Server } from 'lucide-react';
import { XsdTreeView } from './components/XsdTreeView';

interface TreeNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  children?: TreeNode[];
}

function App() {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [xsdContent, setXsdContent] = useState<string>('');
  const [xsdTree, setXsdTree] = useState<TreeNode[]>([]);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    errors?: string[];
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const fetchXsdTree = async () => {
      try {
        const response = await fetch('/xsd-tree');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setXsdTree(data);
      } catch (error) {
        console.error('Error fetching XSD tree:', error);
        setXsdTree([]);
      }
    };

    fetchXsdTree();
    const interval = setInterval(fetchXsdTree, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('/health');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setServerStatus(data.status === 'ok' ? 'online' : 'offline');
      } catch (error) {
        console.error('Server health check error:', error);
        setServerStatus('offline');
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleXsdSelect = async (path: string) => {
    try {
      const response = await fetch(`/xsd-content/${path}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { content } = await response.json();
      setXsdContent(content);
    } catch (error) {
      console.error('Error fetching XSD content:', error);
    }
  };

  const handleValidate = async () => {
    if (!xmlContent || !xsdContent) {
      setValidationResult({
        success: false,
        message: 'Both XML and XSD content are required'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xmlContent, xsdContent }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        success: false,
        message: 'Error connecting to validation server',
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleXmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setXmlContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const loadSampleData = () => {
    setXmlContent(`<?xml version="1.0" encoding="UTF-8"?>
<Document
	xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
	<FIToFICstmrCdtTrf>
		<!-- Group Header -->
		<GrpHdr>
			<MsgId>AJ202503030915</MsgId>
			<!-- Unique message ID -->
			<CreDtTm>2025-03-03T09:15:00-08:00</CreDtTm>
			<!-- Creation date/time in PST -->
			<NbOfTxs>1</NbOfTxs>
			<!-- Number of transactions -->
			<TtlIntrBkSttlmAmt Ccy="USD">150.75</TtlIntrBkSttlmAmt>
			<!-- Total settlement amount -->
			<SttlmInf>
				<SttlmMtd>CLRG</SttlmMtd>
				<!-- Clearing via TCH RTP -->
				<ClrSys>
					<Prtry>RTP</Prtry>
					<!-- TCH RTP proprietary code -->
				</ClrSys>
			</SttlmInf>
			<InstgAgt>
				<FinInstnId>
					<ClrSysMmbId>
						<MmbId>021000021</MmbId>
						<!-- Bank A routing number -->
					</ClrSysMmbId>
					<Nm>Bank A</Nm>
				</FinInstnId>
			</InstgAgt>
			<InstdAgt>
				<FinInstnId>
					<ClrSysMmbId>
						<MmbId>031000053</MmbId>
						<!-- Bank B routing number -->
					</ClrSysMmbId>
					<Nm>Bank B</Nm>
				</FinInstnId>
			</InstdAgt>
		</GrpHdr>
		<!-- Credit Transfer Transaction Information -->
		<CdtTrfTxInf>
			<PmtId>
				<InstrId>AJ202503030915-01</InstrId>
				<!-- Instruction ID -->
				<EndToEndId>AJ-SU-20250303</EndToEndId>
				<!-- End-to-end ID -->
				<TxId>FORM3-TCH-20250303-002</TxId>
				<!-- Transaction ID via Form3 -->
			</PmtId>
			<PmtTpInf>
				<SvcLvl>
					<Cd>URGP</Cd>
					<!-- Urgent payment for RTP -->
				</SvcLvl>
				<LclInstrm>
					<Prtry>RTP</Prtry>
					<!-- TCH RTP local instrument -->
				</LclInstrm>
			</PmtTpInf>
			<IntrBkSttlmAmt Ccy="USD">150.75</IntrBkSttlmAmt>
			<!-- Settlement amount -->
			<IntrBkSttlmDt>2025-03-03</IntrBkSttlmDt>
			<!-- Settlement date -->
			<ChrgBr>DEBT</ChrgBr>
			<!-- Charges borne by debtor -->
			<!-- Debtor (Payer) -->
			<Dbtr>
				<Nm>Alice Johnson</Nm>
				<PstlAdr>
					<Ctry>US</Ctry>
					<AdrLine>456 Elm St, Seattle, WA 98101</AdrLine>
				</PstlAdr>
			</Dbtr>
			<DbtrAcct>
				<Id>
					<Othr>
						<Id>1234567890</Id>
						<!-- Debtor account number -->
					</Othr>
				</Id>
				<Ccy>USD</Ccy>
			</DbtrAcct>
			<DbtrAgt>
				<FinInstnId>
					<ClrSysMmbId>
						<MmbId>021000021</MmbId>
						<!-- Bank A routing number -->
					</ClrSysMmbId>
					<Nm>Bank A</Nm>
				</FinInstnId>
			</DbtrAgt>
			<!-- Creditor Agent -->
			<CdtrAgt>
				<FinInstnId>
					<ClrSysMmbId>
						<MmbId>031000053</MmbId>
						<!-- Bank B routing number -->
					</ClrSysMmbId>
					<Nm>Bank B</Nm>
				</FinInstnId>
			</CdtrAgt>
			<!-- Creditor (Payee) -->
			<Cdtr>
				<Nm>Sunshine Utilities</Nm>
				<PstlAdr>
					<Ctry>US</Ctry>
					<AdrLine>789 Solar Rd, Phoenix, AZ 85001</AdrLine>
				</PstlAdr>
			</Cdtr>
			<CdtrAcct>
				<Id>
					<Othr>
						<Id>0987654321</Id>
						<!-- Creditor account number -->
					</Othr>
				</Id>
				<Ccy>USD</Ccy>
			</CdtrAcct>
			<!-- Remittance Information -->
			<RmtInf>
				<Ustrd>Payment for Invoice #UTIL-2025-456 - Utilities</Ustrd>
			</RmtInf>
		</CdtTrfTxInf>
	</FIToFICstmrCdtTrf>
</Document>`);

    setXsdContent(`<?xml version="1.0" encoding="UTF-8"?>
<!--Generated by Standards Editor (build:R1.6.15) on 2019 Feb 14 13:31:41, ISO 20022 version : 2013-->
<xs:schema xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08" xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
    <xs:element name="Document" type="Document"/>
    <xs:complexType name="AccountIdentification4Choice">
        <xs:choice>
            <xs:element name="IBAN" type="IBAN2007Identifier"/>
            <xs:element name="Othr" type="GenericAccountIdentification1"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="AccountSchemeName1Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalAccountIdentification1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:simpleType name="ActiveCurrencyAndAmount_SimpleType">
        <xs:restriction base="xs:decimal">
            <xs:fractionDigits value="5"/>
            <xs:totalDigits value="18"/>
            <xs:minInclusive value="0"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="ActiveCurrencyAndAmount">
        <xs:simpleContent>
            <xs:extension base="ActiveCurrencyAndAmount_SimpleType">
                <xs:attribute name="Ccy" type="ActiveCurrencyCode" use="required"/>
            </xs:extension>
        </xs:simpleContent>
    </xs:complexType>
    <xs:simpleType name="ActiveCurrencyCode">
        <xs:restriction base="xs:string">
            <xs:pattern value="[A-Z]{3,3}"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ActiveOrHistoricCurrencyAndAmount_SimpleType">
        <xs:restriction base="xs:decimal">
            <xs:fractionDigits value="5"/>
            <xs:totalDigits value="18"/>
            <xs:minInclusive value="0"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="ActiveOrHistoricCurrencyAndAmount">
        <xs:simpleContent>
            <xs:extension base="ActiveOrHistoricCurrencyAndAmount_SimpleType">
                <xs:attribute name="Ccy" type="ActiveOrHistoricCurrencyCode" use="required"/>
            </xs:extension>
        </xs:simpleContent>
    </xs:complexType>
    <xs:simpleType name="ActiveOrHistoricCurrencyCode">
        <xs:restriction base="xs:string">
            <xs:pattern value="[A-Z]{3,3}"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="AddressType2Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="ADDR"/>
            <xs:enumeration value="PBOX"/>
            <xs:enumeration value="HOME"/>
            <xs:enumeration value="BIZZ"/>
            <xs:enumeration value="MLTO"/>
            <xs:enumeration value="DLVY"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="AddressType3Choice">
        <xs:choice>
            <xs:element name="Cd" type="AddressType2Code"/>
            <xs:element name="Prtry" type="GenericIdentification30"/>
        </xs:choice>
    </xs:complexType>
    <xs:simpleType name="AnyBICDec2014Identifier">
        <xs:restriction base="xs:string">
            <xs:pattern value="[A-Z0-9]{4,4}[A-Z]{2,2}[A-Z0-9]{2,2}([A-Z0-9]{3,3}){0,1}"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="BICFIDec2014Identifier">
        <xs:restriction base="xs:string">
            <xs:pattern value="[A-Z0-9]{4,4}[A-Z]{2,2}[A-Z0-9]{2,2}([A-Z0-9]{3,3}){0,1}"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="BaseOneRate">
        <xs:restriction base="xs:decimal">
            <xs:fractionDigits value="10"/>
            <xs:totalDigits value="11"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="BatchBookingIndicator">
        <xs:restriction base="xs:boolean"/>
    </xs:simpleType>
    <xs:complexType name="BranchAndFinancialInstitutionIdentification6">
        <xs:sequence>
            <xs:element name="FinInstnId" type="FinancialInstitutionIdentification18"/>
            <xs:element maxOccurs="1" minOccurs="0" name="BrnchId" type="BranchData3"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="BranchData3">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Id" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="LEI" type="LEIIdentifier"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Nm" type="Max140Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PstlAdr" type="PostalAddress24"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="CashAccount38">
        <xs:sequence>
            <xs:element name="Id" type="AccountIdentification4Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Tp" type="CashAccountType2Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Ccy" type="ActiveOrHistoricCurrencyCode"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Nm" type="Max70Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Prxy" type="ProxyAccountIdentification1"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="CashAccountType2Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalCashAccountType1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="CategoryPurpose1Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalCategoryPurpose1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:simpleType name="ChargeBearerType1Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="DEBT"/>
            <xs:enumeration value="CRED"/>
            <xs:enumeration value="SHAR"/>
            <xs:enumeration value="SLEV"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="Charges7">
        <xs:sequence>
            <xs:element name="Amt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element name="Agt" type="BranchAndFinancialInstitutionIdentification6"/>
        </xs:sequence>
    </xs:complexType>
    <xs:simpleType name="ClearingChannel2Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="RTGS"/>
            <xs:enumeration value="RTNS"/>
            <xs:enumeration value="MPNS"/>
            <xs:enumeration value="BOOK"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="ClearingSystemIdentification2Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalClearingSystemIdentification1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="ClearingSystemIdentification3Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalCashClearingSystem1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="ClearingSystemMemberIdentification2">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="ClrSysId" type="ClearingSystemIdentification2Choice"/>
            <xs:element name="MmbId" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="Contact4">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="NmPrfx" type="NamePrefix2Code"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Nm" type="Max140Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PhneNb" type="PhoneNumber"/>
            <xs:element maxOccurs="1" minOccurs="0" name="MobNb" type="PhoneNumber"/>
            <xs:element maxOccurs="1" minOccurs="0" name="FaxNb" type="PhoneNumber"/>
            <xs:element maxOccurs="1" minOccurs="0" name="EmailAdr" type="Max2048Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="EmailPurp" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="JobTitl" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Rspnsblty" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Dept" type="Max70Text"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="Othr" type="OtherContact1"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PrefrdMtd" type="PreferredContactMethod1Code"/>
        </xs:sequence>
    </xs:complexType>
    <xs:simpleType name="CountryCode">
        <xs:restriction base="xs:string">
            <xs:pattern value="[A-Z]{2,2}"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="CreditDebitCode">
        <xs:restriction base="xs:string">
            <xs:enumeration value="CRDT"/>
            <xs:enumeration value="DBIT"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="CreditTransferTransaction39">
        <xs:sequence>
            <xs:element name="PmtId" type="PaymentIdentification7"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PmtTpInf" type="PaymentTypeInformation28"/>
            <xs:element name="IntrBkSttlmAmt" type="ActiveCurrencyAndAmount"/>
            <xs:element maxOccurs="1" minOccurs="0" name="IntrBkSttlmDt" type="ISODate"/>
            <xs:element maxOccurs="1" minOccurs="0" name="SttlmPrty" type="Priority3Code"/>
            <xs:element maxOccurs="1" minOccurs="0" name="SttlmTmIndctn" type="SettlementDateTimeIndication1"/>
            <xs:element maxOccurs="1" minOccurs="0" name="SttlmTmReq" type="SettlementTimeRequest2"/>
            <xs:element maxOccurs="1" minOccurs="0" name="AccptncDtTm" type="ISODateTime"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PoolgAdjstmntDt" type="ISODate"/>
            <xs:element maxOccurs="1" minOccurs="0" name="InstdAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="1" minOccurs="0" name="XchgRate" type="BaseOneRate"/>
            <xs:element name="ChrgBr" type="ChargeBearerType1Code"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="ChrgsInf" type="Charges7"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PrvsInstgAgt1" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PrvsInstgAgt1Acct" type="CashAccount38"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PrvsInstgAgt2" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PrvsInstgAgt2Acct" type="CashAccount38"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PrvsInstgAgt3" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PrvsInstgAgt3Acct" type="CashAccount38"/>
            <xs:element maxOccurs="1" minOccurs="0" name="InstgAgt" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="InstdAgt" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="IntrmyAgt1" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="IntrmyAgt1Acct" type="CashAccount38"/>
            <xs:element maxOccurs="1" minOccurs="0" name="IntrmyAgt2" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="IntrmyAgt2Acct" type="CashAccount38"/>
            <xs:element maxOccurs="1" minOccurs="0" name="IntrmyAgt3" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="IntrmyAgt3Acct" type="CashAccount38"/>
            <xs:element maxOccurs="1" minOccurs="0" name="UltmtDbtr" type="PartyIdentification135"/>
            <xs:element maxOccurs="1" minOccurs="0" name="InitgPty" type="PartyIdentification135"/>
            <xs:element name="Dbtr" type="PartyIdentification135"/>
            <xs:element maxOccurs="1" minOccurs="0" name="DbtrAcct" type="CashAccount38"/>
            <xs:element name="DbtrAgt" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="DbtrAgtAcct" type="CashAccount38"/>
            <xs:element name="CdtrAgt" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CdtrAgtAcct" type="CashAccount38"/>
            <xs:element name="Cdtr" type="PartyIdentification135"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CdtrAcct" type="CashAccount38"/>
            <xs:element maxOccurs="1" minOccurs="0" name="UltmtCdtr" type="PartyIdentification135"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="InstrForCdtrAgt" type="InstructionForCreditorAgent1"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="InstrForNxtAgt" type="InstructionForNextAgent1"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Purp" type="Purpose2Choice"/>
            <xs:element maxOccurs="10" minOccurs="0" name="RgltryRptg" type="RegulatoryReporting3"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Tax" type="TaxInformation8"/>
            <xs:element maxOccurs="10" minOccurs="0" name="RltdRmtInf" type="RemittanceLocation7"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RmtInf" type="RemittanceInformation16"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="SplmtryData" type="SupplementaryData1"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="CreditorReferenceInformation2">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Tp" type="CreditorReferenceType2"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Ref" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="CreditorReferenceType1Choice">
        <xs:choice>
            <xs:element name="Cd" type="DocumentType3Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="CreditorReferenceType2">
        <xs:sequence>
            <xs:element name="CdOrPrtry" type="CreditorReferenceType1Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Issr" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="DateAndPlaceOfBirth1">
        <xs:sequence>
            <xs:element name="BirthDt" type="ISODate"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PrvcOfBirth" type="Max35Text"/>
            <xs:element name="CityOfBirth" type="Max35Text"/>
            <xs:element name="CtryOfBirth" type="CountryCode"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="DatePeriod2">
        <xs:sequence>
            <xs:element name="FrDt" type="ISODate"/>
            <xs:element name="ToDt" type="ISODate"/>
        </xs:sequence>
    </xs:complexType>
    <xs:simpleType name="DecimalNumber">
        <xs:restriction base="xs:decimal">
            <xs:fractionDigits value="17"/>
            <xs:totalDigits value="18"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="DiscountAmountAndType1">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Tp" type="DiscountAmountType1Choice"/>
            <xs:element name="Amt" type="ActiveOrHistoricCurrencyAndAmount"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="DiscountAmountType1Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalDiscountAmountType1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="Document">
        <xs:sequence>
            <xs:element name="FIToFICstmrCdtTrf" type="FIToFICustomerCreditTransferV08"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="DocumentAdjustment1">
        <xs:sequence>
            <xs:element name="Amt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CdtDbtInd" type="CreditDebitCode"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Rsn" type="Max4Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="AddtlInf" type="Max140Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="DocumentLineIdentification1">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Tp" type="DocumentLineType1"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Nb" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RltdDt" type="ISODate"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="DocumentLineInformation1">
        <xs:sequence>
            <xs:element maxOccurs="unbounded" minOccurs="1" name="Id" type="DocumentLineIdentification1"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Desc" type="Max2048Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Amt" type="RemittanceAmount3"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="DocumentLineType1">
        <xs:sequence>
            <xs:element name="CdOrPrtry" type="DocumentLineType1Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Issr" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="DocumentLineType1Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalDocumentLineType1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:simpleType name="DocumentType3Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="RADM"/>
            <xs:enumeration value="RPIN"/>
            <xs:enumeration value="FXDR"/>
            <xs:enumeration value="DISP"/>
            <xs:enumeration value="PUOR"/>
            <xs:enumeration value="SCOR"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="DocumentType6Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="MSIN"/>
            <xs:enumeration value="CNFA"/>
            <xs:enumeration value="DNFA"/>
            <xs:enumeration value="CINV"/>
            <xs:enumeration value="CREN"/>
            <xs:enumeration value="DEBN"/>
            <xs:enumeration value="HIRI"/>
            <xs:enumeration value="SBIN"/>
            <xs:enumeration value="CMCN"/>
            <xs:enumeration value="SOAC"/>
            <xs:enumeration value="DISP"/>
            <xs:enumeration value="BOLD"/>
            <xs:enumeration value="VCHR"/>
            <xs:enumeration value="AROI"/>
            <xs:enumeration value="TSUT"/>
            <xs:enumeration value="PUOR"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Exact4AlphaNumericText">
        <xs:restriction base="xs:string">
            <xs:pattern value="[a-zA-Z0-9]{4}"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalAccountIdentification1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalCashAccountType1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalCashClearingSystem1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="3"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalCategoryPurpose1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalClearingSystemIdentification1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="5"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalDiscountAmountType1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalDocumentLineType1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalFinancialInstitutionIdentification1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalGarnishmentType1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalLocalInstrument1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="35"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalOrganisationIdentification1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalPersonIdentification1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalProxyAccountType1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalPurpose1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalServiceLevel1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ExternalTaxAmountType1Code">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="FIToFICustomerCreditTransferV08">
        <xs:sequence>
            <xs:element name="GrpHdr" type="GroupHeader93"/>
            <xs:element maxOccurs="unbounded" minOccurs="1" name="CdtTrfTxInf" type="CreditTransferTransaction39"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="SplmtryData" type="SupplementaryData1"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="FinancialIdentificationSchemeName1Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalFinancialInstitutionIdentification1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="FinancialInstitutionIdentification18">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="BICFI" type="BICFIDec2014Identifier"/>
            <xs:element maxOccurs="1" minOccurs="0" name="ClrSysMmbId" type="ClearingSystemMemberIdentification2"/>
            <xs:element maxOccurs="1" minOccurs="0" name="LEI" type="LEIIdentifier"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Nm" type="Max140Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PstlAdr" type="PostalAddress24"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Othr" type="GenericFinancialIdentification1"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="Garnishment3">
        <xs:sequence>
            <xs:element name="Tp" type="GarnishmentType1"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Grnshee" type="PartyIdentification135"/>
            <xs:element maxOccurs="1" minOccurs="0" name="GrnshmtAdmstr" type="PartyIdentification135"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RefNb" type="Max140Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Dt" type="ISODate"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RmtdAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="1" minOccurs="0" name="FmlyMdclInsrncInd" type="TrueFalseIndicator"/>
            <xs:element maxOccurs="1" minOccurs="0" name="MplyeeTermntnInd" type="TrueFalseIndicator"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="GarnishmentType1">
        <xs:sequence>
            <xs:element name="CdOrPrtry" type="GarnishmentType1Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Issr" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="GarnishmentType1Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalGarnishmentType1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="GenericAccountIdentification1">
        <xs:sequence>
            <xs:element name="Id" type="Max34Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="SchmeNm" type="AccountSchemeName1Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Issr" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="GenericFinancialIdentification1">
        <xs:sequence>
            <xs:element name="Id" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="SchmeNm" type="FinancialIdentificationSchemeName1Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Issr" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="GenericIdentification30">
        <xs:sequence>
            <xs:element name="Id" type="Exact4AlphaNumericText"/>
            <xs:element name="Issr" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="SchmeNm" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="GenericOrganisationIdentification1">
        <xs:sequence>
            <xs:element name="Id" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="SchmeNm" type="OrganisationIdentificationSchemeName1Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Issr" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="GenericPersonIdentification1">
        <xs:sequence>
            <xs:element name="Id" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="SchmeNm" type="PersonIdentificationSchemeName1Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Issr" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="GroupHeader93">
        <xs:sequence>
            <xs:element name="MsgId" type="Max35Text"/>
            <xs:element name="CreDtTm" type="ISODateTime"/>
            <xs:element maxOccurs="1" minOccurs="0" name="BtchBookg" type="BatchBookingIndicator"/>
            <xs:element name="NbOfTxs" type="Max15NumericText"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CtrlSum" type="DecimalNumber"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TtlIntrBkSttlmAmt" type="ActiveCurrencyAndAmount"/>
            <xs:element maxOccurs="1" minOccurs="0" name="IntrBkSttlmDt" type="ISODate"/>
            <xs:element name="SttlmInf" type="SettlementInstruction7"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PmtTpInf" type="PaymentTypeInformation28"/>
            <xs:element maxOccurs="1" minOccurs="0" name="InstgAgt" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="InstdAgt" type="BranchAndFinancialInstitutionIdentification6"/>
        </xs:sequence>
    </xs:complexType>
    <xs:simpleType name="IBAN2007Identifier">
        <xs:restriction base="xs:string">
            <xs:pattern value="[A-Z]{2,2}[0-9]{2,2}[a-zA-Z0-9]{1,30}"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="ISODate">
        <xs:restriction base="xs:date"/>
    </xs:simpleType>
    <xs:simpleType name="ISODateTime">
        <xs:restriction base="xs:dateTime"/>
    </xs:simpleType>
    <xs:simpleType name="ISOTime">
        <xs:restriction base="xs:time"/>
    </xs:simpleType>
    <xs:simpleType name="Instruction3Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="CHQB"/>
            <xs:enumeration value="HOLD"/>
            <xs:enumeration value="PHOB"/>
            <xs:enumeration value="TELB"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Instruction4Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="PHOA"/>
            <xs:enumeration value="TELA"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="InstructionForCreditorAgent1">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Cd" type="Instruction3Code"/>
            <xs:element maxOccurs="1" minOccurs="0" name="InstrInf" type="Max140Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="InstructionForNextAgent1">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Cd" type="Instruction4Code"/>
            <xs:element maxOccurs="1" minOccurs="0" name="InstrInf" type="Max140Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:simpleType name="LEIIdentifier">
        <xs:restriction base="xs:string">
            <xs:pattern value="[A-Z0-9]{18,18}[0-9]{2,2}"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="LocalInstrument2Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalLocalInstrument1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:simpleType name="Max10Text">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="10"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Max128Text">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="128"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Max140Text">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="140"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Max15NumericText">
        <xs:restriction base="xs:string">
            <xs:pattern value="[0-9]{1,15}"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Max16Text">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="16"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Max2048Text">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="2048"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Max34Text">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="34"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Max350Text">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="350"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Max35Text">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="35"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Max4Text">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="4"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Max70Text">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="70"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="NameAndAddress16">
        <xs:sequence>
            <xs:element name="Nm" type="Max140Text"/>
            <xs:element name="Adr" type="PostalAddress24"/>
        </xs:sequence>
    </xs:complexType>
    <xs:simpleType name="NamePrefix2Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="DOCT"/>
            <xs:enumeration value="MADM"/>
            <xs:enumeration value="MISS"/>
            <xs:enumeration value="MIST"/>
            <xs:enumeration value="MIKS"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Number">
        <xs:restriction base="xs:decimal">
            <xs:fractionDigits value="0"/>
            <xs:totalDigits value="18"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="OrganisationIdentification29">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="AnyBIC" type="AnyBICDec2014Identifier"/>
            <xs:element maxOccurs="1" minOccurs="0" name="LEI" type="LEIIdentifier"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="Othr" type="GenericOrganisationIdentification1"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="OrganisationIdentificationSchemeName1Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalOrganisationIdentification1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="OtherContact1">
        <xs:sequence>
            <xs:element name="ChanlTp" type="Max4Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Id" type="Max128Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="Party38Choice">
        <xs:choice>
            <xs:element name="OrgId" type="OrganisationIdentification29"/>
            <xs:element name="PrvtId" type="PersonIdentification13"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="PartyIdentification135">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Nm" type="Max140Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PstlAdr" type="PostalAddress24"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Id" type="Party38Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CtryOfRes" type="CountryCode"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CtctDtls" type="Contact4"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="PaymentIdentification7">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="InstrId" type="Max35Text"/>
            <xs:element name="EndToEndId" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TxId" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="UETR" type="UUIDv4Identifier"/>
            <xs:element maxOccurs="1" minOccurs="0" name="ClrSysRef" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="PaymentTypeInformation28">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="InstrPrty" type="Priority2Code"/>
            <xs:element maxOccurs="1" minOccurs="0" name="ClrChanl" type="ClearingChannel2Code"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="SvcLvl" type="ServiceLevel8Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="LclInstrm" type="LocalInstrument2Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CtgyPurp" type="CategoryPurpose1Choice"/>
        </xs:sequence>
    </xs:complexType>
    <xs:simpleType name="PercentageRate">
        <xs:restriction base="xs:decimal">
            <xs:fractionDigits value="10"/>
            <xs:totalDigits value="11"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="PersonIdentification13">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="DtAndPlcOfBirth" type="DateAndPlaceOfBirth1"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="Othr" type="GenericPersonIdentification1"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="PersonIdentificationSchemeName1Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalPersonIdentification1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:simpleType name="PhoneNumber">
        <xs:restriction base="xs:string">
            <xs:pattern value="\\+[0-9]{1,3}-[0-9()+\\-]{1,30}"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="PostalAddress24">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="AdrTp" type="AddressType3Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Dept" type="Max70Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="SubDept" type="Max70Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="StrtNm" type="Max70Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="BldgNb" type="Max16Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="BldgNm" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Flr" type="Max70Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PstBx" type="Max16Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Room" type="Max70Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PstCd" type="Max16Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TwnNm" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TwnLctnNm" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="DstrctNm" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CtrySubDvsn" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Ctry" type="CountryCode"/>
            <xs:element maxOccurs="7" minOccurs="0" name="AdrLine" type="Max70Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:simpleType name="PreferredContactMethod1Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="LETT"/>
            <xs:enumeration value="MAIL"/>
            <xs:enumeration value="PHON"/>
            <xs:enumeration value="FAXX"/>
            <xs:enumeration value="CELL"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Priority2Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="HIGH"/>
            <xs:enumeration value="NORM"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Priority3Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="URGT"/>
            <xs:enumeration value="HIGH"/>
            <xs:enumeration value="NORM"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="ProxyAccountIdentification1">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Tp" type="ProxyAccountType1Choice"/>
            <xs:element name="Id" type="Max2048Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="ProxyAccountType1Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalProxyAccountType1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="Purpose2Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalPurpose1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="ReferredDocumentInformation7">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Tp" type="ReferredDocumentType4"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Nb" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RltdDt" type="ISODate"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="LineDtls" type="DocumentLineInformation1"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="ReferredDocumentType3Choice">
        <xs:choice>
            <xs:element name="Cd" type="DocumentType6Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="ReferredDocumentType4">
        <xs:sequence>
            <xs:element name="CdOrPrtry" type="ReferredDocumentType3Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Issr" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="RegulatoryAuthority2">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Nm" type="Max140Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Ctry" type="CountryCode"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="RegulatoryReporting3">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="DbtCdtRptgInd" type="RegulatoryReportingType1Code"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Authrty" type="RegulatoryAuthority2"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="Dtls" type="StructuredRegulatoryReporting3"/>
        </xs:sequence>
    </xs:complexType>
    <xs:simpleType name="RegulatoryReportingType1Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="CRED"/>
            <xs:enumeration value="DEBT"/>
            <xs:enumeration value="BOTH"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="RemittanceAmount2">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="DuePyblAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="DscntApldAmt" type="DiscountAmountAndType1"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CdtNoteAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="TaxAmt" type="TaxAmountAndType1"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="AdjstmntAmtAndRsn" type="DocumentAdjustment1"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RmtdAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="RemittanceAmount3">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="DuePyblAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="DscntApldAmt" type="DiscountAmountAndType1"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CdtNoteAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="TaxAmt" type="TaxAmountAndType1"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="AdjstmntAmtAndRsn" type="DocumentAdjustment1"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RmtdAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="RemittanceInformation16">
        <xs:sequence>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="Ustrd" type="Max140Text"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="Strd" type="StructuredRemittanceInformation16"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="RemittanceLocation7">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="RmtId" type="Max35Text"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="RmtLctnDtls" type="RemittanceLocationData1"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="RemittanceLocationData1">
        <xs:sequence>
            <xs:element name="Mtd" type="RemittanceLocationMethod2Code"/>
            <xs:element maxOccurs="1" minOccurs="0" name="ElctrncAdr" type="Max2048Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="PstlAdr" type="NameAndAddress16"/>
        </xs:sequence>
    </xs:complexType>
    <xs:simpleType name="RemittanceLocationMethod2Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="FAXI"/>
            <xs:enumeration value="EDIC"/>
            <xs:enumeration value="URID"/>
            <xs:enumeration value="EMAL"/>
            <xs:enumeration value="POST"/>
            <xs:enumeration value="SMSM"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="ServiceLevel8Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalServiceLevel1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="SettlementDateTimeIndication1">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="DbtDtTm" type="ISODateTime"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CdtDtTm" type="ISODateTime"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="SettlementInstruction7">
        <xs:sequence>
            <xs:element name="SttlmMtd" type="SettlementMethod1Code"/>
            <xs:element maxOccurs="1" minOccurs="0" name="SttlmAcct" type="CashAccount38"/>
            <xs:element maxOccurs="1" minOccurs="0" name="ClrSys" type="ClearingSystemIdentification3Choice"/>
            <xs:element maxOccurs="1" minOccurs="0" name="InstgRmbrsmntAgt" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="InstgRmbrsmntAgtAcct" type="CashAccount38"/>
            <xs:element maxOccurs="1" minOccurs="0" name="InstdRmbrsmntAgt" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="InstdRmbrsmntAgtAcct" type="CashAccount38"/>
            <xs:element maxOccurs="1" minOccurs="0" name="ThrdRmbrsmntAgt" type="BranchAndFinancialInstitutionIdentification6"/>
            <xs:element maxOccurs="1" minOccurs="0" name="ThrdRmbrsmntAgtAcct" type="CashAccount38"/>
        </xs:sequence>
    </xs:complexType>
    <xs:simpleType name="SettlementMethod1Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="INDA"/>
            <xs:enumeration value="INGA"/>
            <xs:enumeration value="COVE"/>
            <xs:enumeration value="CLRG"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:complexType name="SettlementTimeRequest2">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="CLSTm" type="ISOTime"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TillTm" type="ISOTime"/>
            <xs:element maxOccurs="1" minOccurs="0" name="FrTm" type="ISOTime"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RjctTm" type="ISOTime"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="StructuredRegulatoryReporting3">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Tp" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Dt" type="ISODate"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Ctry" type="CountryCode"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Cd" type="Max10Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Amt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="Inf" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="StructuredRemittanceInformation16">
        <xs:sequence>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="RfrdDocInf" type="ReferredDocumentInformation7"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RfrdDocAmt" type="RemittanceAmount2"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CdtrRefInf" type="CreditorReferenceInformation2"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Invcr" type="PartyIdentification135"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Invcee" type="PartyIdentification135"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TaxRmt" type="TaxInformation7"/>
            <xs:element maxOccurs="1" minOccurs="0" name="GrnshmtRmt" type="Garnishment3"/>
            <xs:element maxOccurs="3" minOccurs="0" name="AddtlRmtInf" type="Max140Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="SupplementaryData1">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="PlcAndNm" type="Max350Text"/>
            <xs:element name="Envlp" type="SupplementaryDataEnvelope1"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="SupplementaryDataEnvelope1">
        <xs:sequence>
            <xs:any namespace="##any" processContents="lax"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="TaxAmount2">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Rate" type="PercentageRate"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TaxblBaseAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TtlAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="Dtls" type="TaxRecordDetails2"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="TaxAmountAndType1">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Tp" type="TaxAmountType1Choice"/>
            <xs:element name="Amt" type="ActiveOrHistoricCurrencyAndAmount"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="TaxAmountType1Choice">
        <xs:choice>
            <xs:element name="Cd" type="ExternalTaxAmountType1Code"/>
            <xs:element name="Prtry" type="Max35Text"/>
        </xs:choice>
    </xs:complexType>
    <xs:complexType name="TaxAuthorisation1">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Titl" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Nm" type="Max140Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="TaxInformation7">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Cdtr" type="TaxParty1"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Dbtr" type="TaxParty2"/>
            <xs:element maxOccurs="1" minOccurs="0" name="UltmtDbtr" type="TaxParty2"/>
            <xs:element maxOccurs="1" minOccurs="0" name="AdmstnZone" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RefNb" type="Max140Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Mtd" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TtlTaxblBaseAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TtlTaxAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Dt" type="ISODate"/>
            <xs:element maxOccurs="1" minOccurs="0" name="SeqNb" type="Number"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="Rcrd" type="TaxRecord2"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="TaxInformation8">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Cdtr" type="TaxParty1"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Dbtr" type="TaxParty2"/>
            <xs:element maxOccurs="1" minOccurs="0" name="AdmstnZone" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RefNb" type="Max140Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Mtd" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TtlTaxblBaseAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TtlTaxAmt" type="ActiveOrHistoricCurrencyAndAmount"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Dt" type="ISODate"/>
            <xs:element maxOccurs="1" minOccurs="0" name="SeqNb" type="Number"/>
            <xs:element maxOccurs="unbounded" minOccurs="0" name="Rcrd" type="TaxRecord2"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="TaxParty1">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="TaxId" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RegnId" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TaxTp" type="Max35Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="TaxParty2">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="TaxId" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="RegnId" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TaxTp" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Authstn" type="TaxAuthorisation1"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="TaxPeriod2">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Yr" type="ISODate"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Tp" type="TaxRecordPeriod1Code"/>
            <xs:element maxOccurs="1" minOccurs="0" name="FrToDt" type="DatePeriod2"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="TaxRecord2">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Tp" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Ctgy" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CtgyDtls" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="DbtrSts" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="CertId" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="FrmsCd" type="Max35Text"/>
            <xs:element maxOccurs="1" minOccurs="0" name="Prd" type="TaxPeriod2"/>
            <xs:element maxOccurs="1" minOccurs="0" name="TaxAmt" type="TaxAmount2"/>
            <xs:element maxOccurs="1" minOccurs="0" name="AddtlInf" type="Max140Text"/>
        </xs:sequence>
    </xs:complexType>
    <xs:complexType name="TaxRecordDetails2">
        <xs:sequence>
            <xs:element maxOccurs="1" minOccurs="0" name="Prd" type="TaxPeriod2"/>
            <xs:element name="Amt" type="ActiveOrHistoricCurrencyAndAmount"/>
        </xs:sequence>
    </xs:complexType>
    <xs:simpleType name="TaxRecordPeriod1Code">
        <xs:restriction base="xs:string">
            <xs:enumeration value="MM01"/>
            <xs:enumeration value="MM02"/>
            <xs:enumeration value="MM03"/>
            <xs:enumeration value="MM04"/>
            <xs:enumeration value="MM05"/>
            <xs:enumeration value="MM06"/>
            <xs:enumeration value="MM07"/>
            <xs:enumeration value="MM08"/>
            <xs:enumeration value="MM09"/>
            <xs:enumeration value="MM10"/>
            <xs:enumeration value="MM11"/>
            <xs:enumeration value="MM12"/>
            <xs:enumeration value="QTR1"/>
            <xs:enumeration value="QTR2"/>
            <xs:enumeration value="QTR3"/>
            <xs:enumeration value="QTR4"/>
            <xs:enumeration value="HLF1"/>
            <xs:enumeration value="HLF2"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="TrueFalseIndicator">
        <xs:restriction base="xs:boolean"/>
    </xs:simpleType>
    <xs:simpleType name="UUIDv4Identifier">
        <xs:restriction base="xs:string">
            <xs:pattern value="[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}"/>
        </xs:restriction>
    </xs:simpleType>
</xs:schema>`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <FileCheck className="mr-2" size={24} />
            <h1 className="text-xl font-bold">XML Validator</h1>
          </div>
          <div className="flex items-center">
            <Server size={16} className="mr-1" />
            <span className={`text-sm ${
              serverStatus === 'online' 
                ? 'text-green-300' 
                : serverStatus === 'offline' 
                  ? 'text-red-300' 
                  : 'text-yellow-300'
            }`}>
              Server: {serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="mb-6 flex justify-center">
          <button
            onClick={loadSampleData}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Load Sample Data
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* XML Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Code className="text-indigo-600 mr-2" size={20} />
              <h2 className="text-lg font-semibold">XML Content</h2>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload XML File
              </label>
              <input
                type="file"
                accept=".xml"
                onChange={handleXmlFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-600
                  hover:file:bg-indigo-100"
              />
            </div>
            
            <textarea
              value={xmlContent}
              onChange={(e) => setXmlContent(e.target.value)}
              placeholder="Paste your XML content here..."
              className="w-full h-80 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
          </div>

          {/* XSD Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FileCode className="text-indigo-600 mr-2" size={20} />
              <h2 className="text-lg font-semibold">XSD Content</h2>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select XSD from Server
              </label>
              <XsdTreeView data={xsdTree} onSelect={handleXsdSelect} />
            </div>
            
            <textarea
              value={xsdContent}
              onChange={(e) => setXsdContent(e.target.value)}
              placeholder="XSD content will appear here when selected from the tree..."
              className="w-full h-80 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm mt-4"
            />
          </div>
        </div>

        {/* Validation Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleValidate}
            disabled={isLoading || (!xmlContent || !xsdContent)}
            className={`px-6 py-3 rounded-md font-medium text-white ${
              isLoading || (!xmlContent || !xsdContent)
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? 'Validating...' : 'Validate XML against XSD'}
          </button>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className={`mt-8 p-4 rounded-md ${
            validationResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              {validationResult.success ? (
                <CheckCircle className="text-green-500 mr-3 mt-0.5" size={20} />
              ) : (
                <AlertCircle className="text-red-500 mr-3 mt-0.5" size={20} />
              )}
              <div>
                <h3 className={`font-medium ${
                  validationResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.message}
                </h3>
                {validationResult.error && (
                  <p className="mt-1 text-sm text-red-700">{validationResult.error}</p>
                )}
                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div className="mt-2">
                    <h4 className="font-medium text-red-800 mb-1">Validation Errors:</h4>
                    <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-4 mt-8">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          @mrcheidel XML Validator Tool &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

export default App;