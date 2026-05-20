import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from models.schemas import LeadCreate


class TestLeadValidation:
    def test_valid_lead_format(self):
        lead = LeadCreate(
            student_name="Amina Diallo",
            phone="+221771234567",
            school_id="upeps_01"
        )
        assert lead.phone == "+221771234567"
        
    def test_invalid_phone_too_short(self):
        with pytest.raises(Exception):
            LeadCreate(
                student_name="Amina",
                phone="123",
                school_id="upeps_01"
            )
            
    def test_valid_serie(self):
        lead = LeadCreate(
            student_name="Moussa",
            phone="+221771234567",
            school_id="upeps_01",
            serie="S"
        )
        assert lead.serie == "S"
        
    def test_no_serie(self):
        lead = LeadCreate(
            student_name="Moussa",
            phone="+221771234567",
            school_id="upeps_01"
        )
        assert lead.serie is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])