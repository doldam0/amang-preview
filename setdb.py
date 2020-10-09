import pandas as pd
from typing import List, Dict, Type, Any, Union, TypeVar
from amang.models import Department, Generation, Session, Member


T = TypeVar('T')
U = TypeVar('U')

def init(model: Type[T], elements: Union[List[U], Dict[str, Any], List[Dict[str, Any]]], param='name'):
    if isinstance(elements, dict):
        try:
            new = model.objects.get(**elements)
        except model.DoesNotExist:
            new = model(**elements)
            new.save()
        return new
    elif isinstance(elements[0], dict):
        result: List[T] = list()
        for elem in elements:
            kwargs = elem
            try:
                new = model.objects.get(**kwargs)
            except model.DoesNotExist:
                new = model(**kwargs)
                new.save()
            result.append(new)
    else:
        result: Dict[U, T] = dict()
        for elem in elements:
            kwargs = {param: elem}
            try:
                new = model.objects.get(**kwargs)
            except model.DoesNotExist:
                new = model(**kwargs)
                new.save()
            result[elem] = new
    return result

# Set Departments
departments = init(Department, ['Performance', 'Planning', 'Public Relations'])

# Set Generations
generations = init(Generation, [num for num in range(20, 31)], param='number')

main_generation = generations[29]
main_generation.is_main = True
main_generation.save()

# Set Sessions
sessions = init(Session, ['Vocal', 'Guitar', 'Bass', 'Synthesizer', 'Drum'])

# Set Members
translate = {
    '보컬': 'Vocal',
    '기타': 'Guitar',
    '베이스': 'Bass',
    '신디': 'Synthesizer',
    '드럼': 'Drum',
    '공연부': 'Performance',
    '기획부': 'Planning',
    '홍보부': 'Public Relations'
}

df = pd.read_csv('amang.csv').replace(translate)
for row in df.itertuples():
    member_info = {
        'name': row.name,
        'department': departments[row.department] if not pd.isna(row.department) else None,
        'generation': generations[row.generation]
    }
    member: Member = init(Member, member_info)
    member.save()

    member.sessions.add(sessions[row.session], through_defaults={'priority': 1})
    if not pd.isna(row.sub_session):
        member.sessions.add(sessions[row.sub_session], through_defaults={'priority': 2})

print('done')
