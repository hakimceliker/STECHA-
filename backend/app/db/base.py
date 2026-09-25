from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Tüm modellerin miras aldığı temel sınıf. Kapsam dokümanının
    'Veritabanı şeması' bölümündeki tabloların SQLAlchemy karşılığıdır."""
    pass
