"use client";

import { useEffect, useState, useRef } from "react";
import { TableColumnsType, Input, message, Button, Form } from "antd";
import { IDonor } from "@/types/IDonor";
import TableComponent from "./table";
import { getDonors } from "@/lib/actions/donors.actions";
import { useModal } from "@/app/store/modalStore";
import DonorForm, {DonorFormRef} from "../form/DonorForm";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { fetchData } from "next-auth/client/_utils";

const { Search } = Input;


const DonorTable: React.FC<{ refresh: boolean }> = ({ refresh }) => {
  const [data, setData] = useState<IDonor[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState<IDonor[]>([]);
  const [searchText, setSearchText] = useState("");
  const {openModal, closeModal } = useModal();
  const [refreshTable, setRefreshTable] = useState(false);

  const formRef = useRef<DonorFormRef | null>(null);
  



  

  const deleteDonor = async (_id: string) => {
    try {
      const response = await fetch(`/api/donors/${_id}`, {
        method: "DELETE",
      });
  
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du donateur");
      }
  
      message.success("Donateur supprimé avec succès");
  
      // 🔥 Mise à jour immédiate de la liste après suppression
      setData((prevData) => prevData.filter((b) => b._id.toString() !== _id));
      setFilteredData((prevData) => prevData.filter((b) => b._id.toString() !== _id));
  
    } catch (error) {
      message.error("Échec de la suppression");
      console.error(error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const donors = await getDonors();
      const formattedData = donors.map((b: IDonor) => ({
        ...b,
        key: b._id, // Ajoute `key` requis par Ant Design
      }));
      setData(formattedData);
      setFilteredData(formattedData); // Initialise `filteredData` avec toutes les données
    } catch (error) {
      message.error("Erreur lors du chargement des donateurs");
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchData();
  }, [refreshTable]);

  const editDonorModal = (donor: IDonor) => {
    openModal({
      title: "Modifier ce donateur",
      component: <DonorForm donor={donor} ref={formRef} />,
      okText: "Modifier",
      cancelText: "Annuler",
      onOk: async () => {
        if (formRef.current) {
          try {
            await formRef.current.validateFields(); // ✅ Valide les champs
            await formRef.current.submit(); // ✅ Soumet le formulaire
            closeModal(); // ✅ Ferme la modal après soumission
            setRefreshTable((prev) => !prev); // ✅ Rafraîchit la table
          } catch (error) {
            console.error("Validation échouée (donateur)", error);
          }
        }
      },
    });
  };
  

  // Fonction de recherche
  const handleSearch = (value: string) => {
    setSearchText(value);
    const filtered = data.filter((donor) =>
      Object.values(donor).some((field) =>
        field?.toString().toLowerCase().includes(value.toLowerCase())
      )
    );
    setFilteredData(filtered);
  };


  const columns: TableColumnsType<IDonor> = [
    {
      title: "Nom",
      dataIndex: "name",
      render: (name: string, record: IDonor) => (
        <Button type="link" onClick={() => editDonorModal(record)}>
          {name}
        </Button>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Téléphone",
      dataIndex: "phone",
    },
    {
      title: "Type de don",
      dataIndex: "donationType",
    },
    {
      title: "Statut",
      dataIndex: "status",
    },
    {
      title: "Actions",
      render: (_, record: IDonor) => (
        <div className="flex space-x-3">
          <Button
            type="primary"
            onClick={() => {
              editDonorModal(record); 
            }}
            icon={<EditOutlined />}
          />
          <Button
            danger
            onClick={() => {
              if (window.confirm("Voulez-vous vraiment supprimer ce donateur ?")) {
                deleteDonor(record._id.toString());
              }
            }}
            icon={<DeleteOutlined />}
          />
        </div>
        
      ),
    }
  ];

  return (
    <div>
      {/* Barre de recherche */}
      <div className="flex justify-center">
        <Search
          placeholder="Rechercher un donateur..."
          allowClear
          size="middle"
          onChange={(e) => handleSearch(e.target.value)}
          style={{ maxWidth: 600, marginBottom: 5 }}
        />
      </div>
      <TableComponent<IDonor>
        loading={loading}
        columns={columns}
        data={filteredData}
      />
    </div>
  );
};

export default DonorTable;
